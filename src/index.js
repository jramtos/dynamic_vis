/* 
Data Vis Project
*/
import '../main.css';
import { csv } from 'd3-fetch';
import { select, selectAll } from 'd3-selection';
import { nest } from 'd3-collection';
import { line } from 'd3-shape';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { extent, schemeSet2 } from 'd3';
import "intersection-observer";
import scrollama from "scrollama";

//Helper functions
function unique(data, key) {
    return Array.from(data.reduce((acc, row) => {
        return acc.add(row[key])
    }, new Set()))
};

function nest_data_fil(data, conditional_var, group_interest, demo_var = null) {
    var filtered = data.filter(d => (d['group'] == group_interest)
        & (d['conditional_var'] == conditional_var));
    if (demo_var) {
        filtered = filtered.filter(d => (d['demo_var'] == demo_var))
    }
    return nest()
        .key(d => d.conditional_cat)
        .entries(filtered)
}

function get_maxmin(group, variable) {
    return group.reduce(
        (acc, group) => {
            const vals = group.values.map((d) => d[variable]);
            return {
                max: Math.max(acc.max, ...vals),
                min: Math.min(acc.min, ...vals),
            };
        },
        {
            max: -Infinity,
            min: Infinity,
        }
    )
};

csv("../data/survey_aggregates.csv")
    .then(dataset => {
        first_scroll(dataset)
    });

function first_scroll(data) {

    var main = select('main');
    var scrolly = main.select("#scrolly");
    var figure = scrolly.select("figure");
    var article = scrolly.select("article");
    var step = article.selectAll(".step");
    var timeOuts = [];

    // initialize the scrollama
    var scroller = scrollama();

    // generic window resize listener event
    function handleResize() {
        // 1. update height of step elements
        var stepH = Math.floor(window.innerHeight * 0.75);
        step.style("height", stepH + "px");
        var figureHeight = window.innerHeight / 4;
        var figureMarginTop = (window.innerHeight - figureHeight) / 4;
        figure
            .style("height", figureHeight + "px")
            .style("top", figureMarginTop + "px");
        // 3. tell scrollama to update new element dimensions
        scroller.resize();
    }

    // scrollama event handlers
    function handleStepEnter(response) {
        // add color to current step only
        step.classed("is-active", function (d, i) {
            return i === response.index;
        });

        // update graphic based on step
        figure.select("p").text(response.index + 1);

        //Pass step to lineplot
        timeOuts.forEach(function (timeOutFn) {
            clearTimeout(timeOutFn);
        });
        lineplot(data, response.index);
    }

    function setupStickyfill() {
        selectAll(".sticky").each(function () {
            Stickyfill.add(this);
        });
    }

    function init() {
        setupStickyfill();
        // 1. force a resize on load to ensure proper dimensions are sent to scrollama
        handleResize();
        // 2. setup the scroller passing options this will also initialize trigger observations
        // 3. bind scrollama event andlers (this can be chained like below)
        scroller
            .setup({
                step: "#scrolly article .step",
                offset: 0.33,
                debug: true
            })
            .onStepEnter(handleStepEnter);

        // setup resize event
        window.addEventListener("resize", handleResize);
    }
    // kick things off
    init();

    //Fix dictonaries and other relevant variables
    const demo_dic = {
        'age': {
            1: '18-24', 2: '25-34', 3: '35-44',
            4: '45-54', 5: '55-64', 6: '65 or Older'
        },
        'race': {
            1: 'Black', 2: 'White', 3: 'Hispanic', 4: 'Indian',
            5: 'Asian', 6: 'Other'

        }
    };

    const mental_illness_dic = {
        0: 'No Mental Ilness',
        1: 'Non-Serious Mental Illness',
        2: 'Serious Mental Illness'
    }

    const mental_ill = [0, 1, 2]

    //Define fixed variables
    const height = 590;
    const width = 710;
    const margin = { left: 50, top: 100, bottom: 90, right: 130 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    //Scale Variables
    var yScale = scaleLinear()
        .range([plotHeight, 0]);
    var xScale = scaleLinear()
        .range([0, plotWidth])
    var mental_ill_colors = scaleOrdinal()
        .range(schemeSet2.slice(0, 3))
        .domain(mental_ill);

    //Line Generator Function
    const lineScale = line()
        .x(d => {
            return xScale(d.demo_cat)
        })
        .y(d => yScale(d.times_arrested));


    //Parent svg
    let svg = select('#app')
        .append('svg')
        .attr('height', `${height}`)
        .attr('width', `${width}`)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    //Add axis
    svg.append("g")
        .attr("class", "y-axis")

    svg
        .append('g')
        .attr('class', 'x-axis')

    //Useful functions for this plot
    //Get title name
    function title_name(variable_name) {
        if (variable_name === 'age') {
            return 'Age Group'
        }
        else if (variable_name == 'race') {
            return 'Race'
        }
    }
    //Lineplot
    function lineplot(data, step) {
        let dem_group = 'age';
        let group_interest = null;

        if (step == 0) {
            group_interest = 'All'
        } else if (step == 1) {
            group_interest = 'Female';
        } else {
            dem_group = 'race';
            group_interest = 'All'
        }

        svg.selectAll(".title").remove();
        svg.selectAll(".x-label").remove();

        //Scale Variables
        xScale.domain(extent(data.filter(d => d.demo_var == dem_group),
            d => Number(d.demo_cat)));
        svg.select('.x-axis')
            .call(
                axisBottom(xScale)
                    .tickValues(unique(data.filter(d => d.demo_var == dem_group), 'demo_cat'))
                    .tickFormat(row => demo_dic[dem_group][Number(row)])
            )
            .style('font-size', '13px')
            .attr('transform', `translate(0, ${plotHeight})`);

        //Stuff that needs to be updated every step
        //Aesthetics for the graph
        //Update Title
        const size = 12;
        svg.append("text")
            .attr("x", plotWidth - 250)
            .attr("y", -3 - (margin.top / 2))
            .attr('id', 'title-first-graph')
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style('font-weight', 'bold')
            .style('fill', 'black')
            .text(`Average Number of Arrests by Prevalence of Mental Illness and ${title_name(dem_group)}`)
            .attr('class', 'title')
        // Update text label for the x axis
        svg.append("text")
            .attr('class', 'x-label')
            .attr("x", margin.right + 150)
            .attr("y", plotHeight + 50)
            .attr("dx", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "15px")
            .style('font-weight', 'bold')
            .style('fill', 'grey')
            .text(title_name(dem_group));
        //Get Step data
        let groupData = nest_data_fil(data, 'mental_illness', group_interest, dem_group)


        //Get Custom Domains and Axis
        var yDomain = get_maxmin(groupData, 'times_arrested')
        yScale.domain([yDomain.min, yDomain.max]).nice()

        svg.selectAll(".y-axis")
            .call(axisLeft(yScale))
            .append('text')
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text('Times Arrested')

        const first_time = svg.selectAll("rect").empty();
        console.log(first_time);

        if (first_time) {
            //Other Fixed Aesthetics
            //Legend
            svg.selectAll("squares")
                .data(mental_ill.sort((a, b) => Number(b) - Number(a)))
                .enter()
                .append("rect")
                .attr("x", plotWidth - 60)
                .attr("y", (d, i) => -5 + i * 25)
                .attr("width", size)
                .attr("height", size)
                .style("fill", d => mental_ill_colors(d))
                .attr('class', d => d)
                .attr('id', 'legend')

            svg.selectAll("names")
                .data(mental_ill.sort((a, b) => Number(b) - Number(a)))
                .enter()
                .append("text")
                .attr("x", plotWidth - 45)
                .attr("y", (d, i) => 3 + i * 25)
                .text(d => mental_illness_dic[d])
                .attr('class', d => d)
                .attr("text-anchor", "right")
                .attr('font-size', "12px")
                .style("alignment-baseline", "middle")
                .attr('id', 'legend')

            svg.append("text")
                .attr("x", 50)
                .attr("y", plotHeight + 70)
                .attr("text-anchor", "middle")
                .style("font-size", "12px")
                .text("Source: BJS 2016 Inmates Survey")
                .attr('id', 'legend');

            // text label for the y axis
            svg.append("text")
                .attr('class', 'y-label')
                .attr("transform", "rotate(-90)")
                .attr("y", 0 - margin.left)
                .attr("x", plotHeight / 2 - 400)
                .attr("dy", "1em")
                .style("text-anchor", "middle")
                .style("font-size", "15px")
                .style('font-weight', 'bold')
                .style('fill', 'grey')
                .text('Number of Times Arrested');

        }
        //Plot points
        svg.selectAll("circle").remove()

        svg.selectAll(".g.dot")
            .data(groupData)
            .enter().append("g")
            .attr("class", "dot")
            .selectAll("circle")
            .data(d => d.values) // <--- identity function here
            .enter().append("circle")
            .attr("r", 4)
            .transition().duration(1000)
            .attr("cx", d => xScale(d.demo_cat))
            .attr("cy", d => yScale(d['times_arrested']))
            .attr('stroke', 'grey')
            .attr('fill', d => mental_ill_colors(d.conditional_cat))


        //Plot Lines
        //svg.selectAll(".lines").remove()

        var lines = svg.selectAll(".lines")
            .data(groupData)
        lines.exit().remove();
        lines
            .enter()
            .append("path")
            .attr('class', 'lines')
            .merge(lines)
            .transition().duration(1000)
            .attr("fill", "none")
            .attr('stroke-width', 3)
            .attr('stroke', d => {
                return mental_ill_colors(d.key)
            })
            .attr("d", d => lineScale(d.values))



    }


}