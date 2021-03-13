/* 
Data Vis Project
*/
import '../main.css';
import { csv } from 'd3-fetch';
import { select, selectAll } from 'd3-selection';
import { nest } from 'd3-collection';
import { line } from 'd3-shape';
import { scaleLinear, scaleOrdinal, scalePoint } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { extent, schemeSet2, format } from 'd3';
import { transition } from 'd3-transition';
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

//Fix dictonaries and other relevant variables
const demo_dic = {
    'age': {
        1: '18-24', 2: '25-34', 3: '35-44',
        4: '45-54', 5: '55-64', 6: '65 or Older'
    },
    'race': {
        1: 'Hispanic', 2: 'White', 3: 'Black', 4: 'Other',
        5: 'Unknown'

    }
};

const mental_illness_dic = {
    0: 'No Mental Ilness',
    1: 'Non-Serious Mental Illness',
    2: 'Serious Mental Illness'
}

const mental_ill = [0, 1, 2]

// INITIALIZE HERE//

csv("../data/survey_aggregates.csv")
    .then(dataset => {
        first_graph(dataset)
        scroll_all(dataset)
    });
////////////////////////////// First Function Graph ////////////////////////////

function first_graph(data) {
    //Define fixed variables
    const height = 490;
    const width = 600;
    const margin = { left: 50, top: 100, bottom: 90, right: 130 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const time_units = 1000;
    const dem_group = 'age';


    //Scale Variables
    var yScale = scaleLinear()
        .range([plotHeight, 0]);
    var xScale = scaleLinear()
        .domain(extent(data.filter(d => d.demo_var == dem_group),
            d => Number(d.demo_cat)))
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
    let svg = select('#times-arrested')
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
        .style('font-size', '13px')
        .attr('transform', `translate(0, ${plotHeight})`)
        .call(
            axisBottom(xScale)
                .tickValues(unique(data.filter(d => d.demo_var == dem_group), 'demo_cat').map(d => Number(d)))
                .tickFormat(row => demo_dic[dem_group][Number(row)])
        )
        .call(adjustTextLabels);     // adjusts text labels on the axis 

    function adjustTextLabels(selection) {
        selection.selectAll('.x-axis text')
            .attr('transform', `translate(${15},0)`);
    }

    //Other Fixed Aesthetics 
    const size = 12;
    svg.append("text")
        .attr("x", plotWidth - 200)
        .attr("y", -1 - (margin.top / 2))
        .attr('id', 'title-first-graph')
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style('font-weight', 'bold')
        .style('fill', 'black')
        .text(`Average Arrests by Age and Prevalence of Mental Illness`)
        .attr('class', 'title')

    svg.append("text")
        .attr('class', 'x-label')
        .attr("x", plotWidth / 2)
        .attr("y", plotHeight + 50)
        .attr("dx", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "15px")
        .style('font-weight', 'bold')
        .style('fill', 'grey')
        .text('Age Group');

    //Legend
    svg.selectAll("squares")
        .data(mental_ill.sort((a, b) => Number(b) - Number(a)))
        .enter()
        .append("rect")
        .attr("x", plotWidth - 20)
        .attr("y", (d, i) => -25 + i * 25)
        .attr("width", size)
        .attr("height", size)
        .style("fill", d => mental_ill_colors(d))
        .attr('class', d => d)
        .attr('id', 'legend')

    svg.selectAll("names")
        .data(mental_ill.sort((a, b) => Number(b) - Number(a)))
        .enter()
        .append("text")
        .attr("x", plotWidth - 5)
        .attr("y", (d, i) => -18 + i * 25)
        .text(d => mental_illness_dic[d])
        .attr('class', d => d)
        .attr("text-anchor", "right")
        .attr('font-size', "11px")
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
        .attr("x", -plotHeight / 2)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "15px")
        .style('font-weight', 'bold')
        .style('fill', 'grey')
        .text('Number of Times Arrested');

    var div = select("#first-part")
        .append('div')
        .attr("class", "tooltip")
        .style("opacity", 0);
    //UPDATES HERE
    update(data, 'All')
    //Lineplot
    function update(data, group_interest) {

        //Stuff that needs to be updated every step
        //Aesthetics for the graph

        svg.selectAll('.subtitle').remove()
        //Get Step data
        let groupData = nest_data_fil(data, 'mental_illness', group_interest, dem_group)
        var formatDecimal = format(",.2f");

        //Get Custom Domains and Axis
        var yDomain = get_maxmin(groupData, 'times_arrested')
        yScale.domain([yDomain.min - 1, yDomain.max]).nice()

        svg.selectAll("g.y-axis")
            .transition(transition().duration(time_units))
            .call(axisLeft(yScale))
        //Custom subtitle
        svg.append("text")
            .attr("x", plotWidth - 200)
            .attr("y", 27 - (margin.top / 2))
            .attr('id', 'subtitle-title-first-graph')
            .attr("text-anchor", "middle")
            .style("font-size", "15px")
            .style('font-weight', 'bold')
            .style('fill', 'black')
            .text(`Inmates Population:  ${group_interest}`)
            .attr('class', 'subtitle')
        //Plot points
        svg.selectAll("circle").remove()

        var dots = svg.selectAll(".g.dot")
            .data(groupData)
            .enter()
            .append("g")
            .attr("class", "dot")
            .selectAll("circle")
            .data(d => d.values) // <--- identity function here
            .enter().append("circle")
            .attr("r", 5)

        dots.transition().duration(time_units)
            .attr("cx", d => xScale(d.demo_cat))
            .attr("cy", d => yScale(d['times_arrested']))
            .attr('stroke', 'grey')
            .attr('fill', d => mental_ill_colors(d.conditional_cat))

        dots.on("mouseover", function (event, d) {
            div.transition()
                .duration(200)
                .style("opacity", .9);

            div.html("Group: " + demo_dic['age'][d.demo_cat] +
                "<br/>" + "Average Arrests: " + formatDecimal(d.times_arrested))
                .style("left", (event.pageX) + "px")
                .style("top", (event.pageY - 10) + "px")
                .style('background', mental_ill_colors(d.conditional_cat));
        })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });



        //Plot Lines
        var lines = svg.selectAll(".lines")
            .data(groupData)
        lines.exit().remove();

        lines
            .enter()
            .append("path")
            .attr('class', 'lines')
            .merge(lines)
            .transition().duration(time_units)
            .attr("fill", "none")
            .attr('stroke-width', 3)
            .attr('stroke', d => {
                return mental_ill_colors(d.key)
            })
            .attr("d", d => lineScale(d.values))
    }

    selectAll("input")
        .on("change", function change() {
            update(data, this.value,);
        });
}
//////////////////////////////////// Scroll  //////////////////////////////////// 
function scroll_all(data) {

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
        var figureHeight = window.innerHeight / 2;
        var figureMarginTop = (window.innerHeight - figureHeight) / 2;
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


        //Pass step to lineplot
        if (response.index == 0) {
            timeOuts.forEach(function (timeOutFn) {
                clearTimeout(timeOutFn);
            });

            first_batch(data)


        }




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
            .onStepEnter(handleStepEnter)

        // setup resize event
        window.addEventListener("resize", handleResize);
    }
    // kick things off
    init();

    function first_batch(data) {

    }
}