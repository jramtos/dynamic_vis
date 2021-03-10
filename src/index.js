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

// Read Data and call Scatter plot function

csv("../data/mental_illness_tab.csv")
    .then((dataset, error) => {
        if (error) {
            return console.warn(error);
        } else {
            lineplot(dataset)
        }
    });

var scrolly = select("#scrolly");
var figure = scrolly.select("figure");
var article = scrolly.select("article");
var step = article.selectAll(".step");

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
    // 3. bind scrollama event handlers (this can be chained like below)
    scroller
        .setup({
            step: "#scrolly article .step",
            offset: 0.50,
            debug: false
        })
        .onStepEnter(handleStepEnter);

    // setup resize event
    window.addEventListener("resize", handleResize);
}
// kick things off
init();
//Fix dictonaries 
const age_dic = {
    1: '18-24', 2: '25-34', 3: '35-44',
    4: '45-54', 5: '55-64', 6: '65 or Older'
};

const mental_illness_dic = {
    0: 'No Mental Ilness',
    1: 'Non-Serious Mental Illness',
    2: 'Serious Mental Illness'
}

//Define fixed variables
const height = 490;
const width = 700;
const margin = { left: 80, top: 30, bottom: 90, right: 120 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

//Helper functions
function unique(data, key) {
    return Array.from(data.reduce((acc, row) => {
        return acc.add(row[key])
    }, new Set()))
};

function nest_data_fil(data, category, gender_fil) {
    var filtered = data.filter(d => (d.gender == gender_fil)
        & (d.var == category));
    return nest()
        .key(d => d.mental_illness)
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

//Lineplot
function lineplot(data) {
    ;
    //Fixed Variables
    const dem_group = 'age';
    const mental_ill = unique(data, 'mental_illness')
    const numeric_var = 'times_arrested';

    //Scale Variables
    var yScale = scaleLinear()
        .range([plotHeight, 0]);
    var xScale = scaleLinear()
        .range([0, plotWidth])
        .domain(extent(data.filter(d => d.var == dem_group),
            d => d.demo));
    var mental_ill_colors = scaleOrdinal()
        .range(schemeSet2.slice(0, 3))
        .domain(mental_ill);


    //Line Generator Function
    const lineScale = line()
        .x(d => {
            return xScale(d.demo)
        })
        .y(d => yScale(d[numeric_var]));

    //Parent svg
    const svg = select('#app')
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
        .call(
            axisBottom(xScale)
                .tickValues(unique(data.filter(d => d.var == dem_group), 'demo'))
                .tickFormat(row => age_dic[Number(row)])
        )
        .attr('transform', `translate(0, ${plotHeight})`);

    //Aesthetics for the graph
    svg.append("text")
        .attr("x", plotWidth - 220)
        .attr("y", -3 - (margin.top / 2))
        .attr('id', 'title-first-graph')
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style('font-weight', 'bold')
        .style('fill', 'black')
        .text(`Average Number of Arrests by Prevalence of Mental Illness Across Age Groups`)

    const size = 12;

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

    svg.append("text")
        .attr("x", 50)
        .attr("y", plotHeight + 60)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Source: BJS 2016 Inmates Survey");

    // text label for the y axis
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.top - 70)
        .attr("x", margin.left - 250)
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style('font-weight', 'bold')
        .style('fill', 'grey')
        .text('Number of Times Arrested');

    // text label for the x axis
    svg.append("text")
        .attr("x", margin.left + 160)
        .attr("y", plotHeight + 40)
        .attr("dx", "1em")
        .style("text-anchor", "middle")
        .style("font-size", "12px")
        .style('font-weight', 'bold')
        .style('fill', 'grey')
        .text('Group Age');

    //Draw first one
    let lines = null;
    update('Male', true);
    //Update
    function update(gender, first_time) {

        let groupData = nest_data_fil(data, 'age', gender)

        //Get Custom Domains and Axis
        var yDomain = get_maxmin(groupData, numeric_var)
        yScale.domain([yDomain.min, yDomain.max]).nice()

        svg.selectAll(".y-axis")
            .call(axisLeft(yScale))
            .append('text')
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text('Times Arrested')


        //Plot lines for custom data

        if (first_time) {

            lines = groupData.map(data => {
                return svg.append('g')
                    .append("path")
                    .datum(data)
                    .attr('d', d => lineScale(d.values))
                    .attr('stroke', d => mental_ill_colors(d.key))
                    .attr('stroke-width', 4)
                    .attr('fill', 'none')
            })

            svg.selectAll("g.dot")
                .data(groupData)
                .enter().append("g")
                .attr("class", "dot")
                .selectAll("circle")
                .data(d => d.values) // <--- identity function here
                .enter().append("circle")
                .attr("r", 4)
                .attr("cx", d => xScale(d.demo))
                .attr("cy", d => yScale(d[numeric_var]))
                .attr('stroke', 'grey')
                .attr('fill', d => mental_ill_colors(d.mental_illness))

        } else {

            groupData.map((row, idx) =>
                lines[idx]
                    .datum(row)
                    .transition()
                    .duration(1000)
                    .attr('d', d => lineScale(d.values))
                    .attr('stroke', d => mental_ill_colors(d.key))
                    .attr('stroke-width', 4)
                    .attr('fill', 'none'))

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
                .attr("cx", d => xScale(d.demo))
                .attr("cy", d => yScale(d[numeric_var]))
                .attr('stroke', 'grey')
                .attr('fill', d => mental_ill_colors(d.mental_illness))
        }
    }

    selectAll("input")
        .on("change", function change() {
            update(this.value, false);
        });

}


