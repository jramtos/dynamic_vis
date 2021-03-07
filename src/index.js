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
import { schemePaired } from 'd3';

// Read Data and call Scatter plot function

csv("../data/mental_illness_tab.csv")
    .then((dataset, error) => {
        if (error) {
            return console.warn(error);
        } else {
            lineplot(dataset)
        }
    });

//Fix dictonaries 
const age_dic = {
    1: '18-24', 2: '25-34', 3: '35-44',
    4: '45-54', 5: '55-64', 6: '65 or Older'
};

//Define fixed variables
const height = 400;
const width = 400;
const margin = { left: 50, top: 50, bottom: 50, right: 50 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

//Unique value function
function unique(data, key) {
    return Array.from(data.reduce((acc, row) => {
        return acc.add(row[key])
    }, new Set()))
};

function nest_data_fil(data, category, gender_fil) {
    var filtered = data.filter(d => (d.gender == 'Male')
        & (d.var == 'age'));
    return nest()
        .key(d => d.mental_illness)
        .entries(filtered)
}

//Lineplot
function lineplot(data) {
    ;
    //Make group variables
    const age_range = [1, 6];
    const mental_ill = unique(data, 'mental_illness')

    //Scales
    const yScale = scaleLinear()
        .domain([0, 2])
        .range([plotWidth, 0]);

    const xScale = scaleLinear()
        .domain(age_range)
        .range([0, plotWidth]);

    var mental_ill_colors = scaleOrdinal()
        .range(schemePaired)
        .domain(mental_ill);

    const lineScale = line()
        .x(d => {
            return xScale(d.demo)
        })
        .y(d => yScale(d.times_arrested));

    //Parent svg
    const svg = select('#app')
        .append('svg')
        .attr('height', `${height}`)
        .attr('width', `${width}`)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    //Add axis
    svg
        .append('g')
        .attr('class', 'x-axis')
        .call(
            axisBottom(xScale)
                .tickValues(unique(data.filter(d => d.var == 'age'), 'demo'))
                .tickFormat(row => age_dic[Number(row)])
        )
        .attr('transform', `translate(0, ${plotHeight})`);

    svg
        .append('g')
        .attr('class', 'y-axis')
        .call(
            axisLeft(yScale)
        )
        .append('text')
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text('Times Arrested');

    //console.log(nest_data_fil(data, 'age', 'Male')[0].values)
    // Initialize line with first group of the list
    svg.selectAll(".line")
        .data(nest_data_fil(data, 'age', 'Male'))
        .enter()
        .append("path")
        .attr("fill", "none")
        .attr("stroke", function (d) {
            return mental_ill_colors(d.key)
        })
        .attr("stroke-width", 1.5)
        .attr("d", d => {
            return lineScale(d.values)
        })


}
