/* 
Data Vis Project
*/
import '../main.css';
import { json } from 'd3-fetch';
import { select, selectAll } from 'd3-selection';
import { extent, mean, rollups } from 'd3-array';
import { line } from 'd3-shape';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { schemePaired } from 'd3';

// Read Data and call Scatter plot function

json("../data/survey_relevant.json")
    .then((dataset, error) => {
        if (error) {
            return console.warn(error);
        } else {
            lineplot(dataset);
        }
    });

//Fix dictonaries 
const age_dic = {
    1: '18-24', 2: '25-34', 3: '35-44',
    4: '45-54', 5: '55-64', 6: '65 or Older'
};

//Define fixed variables
const height = 500;
const width = 500;
const margin = { top: 70, bottom: 70, right: 70, left: 70 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

//Unique value function
function unique(data, key) {
    return Array.from(data.reduce((acc, row) => {
        return acc.add(row[key])
    }, new Set()))
};

function mean_times_arrested(data, key) {
    return rollups(data,
        v => mean(v, d => d.times_arrested),
        d => d[key],
        d => d.age_range,
    )
}

//Lineplot
function lineplot(data) {

    //Make group variables
    const age_range = extent(data, d => d.age_range);
    const mental_ill = unique(data, 'has_mi');

    //Scales
    const yScale = scaleLinear()
        .domain([0, 2])
        .range([plotWidth, 0]);

    const xScale = scaleLinear()
        .domain(age_range)
        .range([0, plotWidth]);

    var mental_ill_colors = scaleOrdinal()
        .domain(mental_ill)
        .range(schemePaired);

    //Linescale
    const lineScale = line()
        .x(d => {
            return xScale(d[0])
        })
        .y(d => {
            return yScale(d[1])
        });

    //Parent svg
    const svg = select('#app')
        .append('svg')
        .attr('height', `${height}px`)
        .attr('width', `${width}px`)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    //Add axis
    svg
        .append('g')
        .attr('class', 'x-axis')
        .call(
            axisBottom(xScale)
                .tickValues(unique(data, 'age_range').sort())
                .tickFormat(row => age_dic[row])
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


    // Initialize line with first group of the list
    let lines = mean_times_arrested(data.filter(d => d.gender == 'Male'),
        'has_mi').map((row, idx) =>
            svg.append('g')
                .append("path")
                .datum(row[1].sort())
                .attr('d', d => lineScale(d))
                .attr('stroke', mental_ill_colors(row[0]))
                .attr('stroke-width', 4)
                .attr('fill', 'none')

        );

    // A function that update the chart
    function update(selectedGroup) {

        // Create new data with the selection?
        var dataFilter = mean_times_arrested(
            data.filter(d => d.gender == selectedGroup),
            'has_mi')
        console.log(dataFilter)
        // Give these new data to update line
        dataFilter.map((row, idx) =>
            lines[idx]
                .datum(row[1].sort())
                .transition()
                .duration(1000)
                .attr('d', d => lineScale(d))
                .attr('stroke', mental_ill_colors(row[0]))
                .attr('stroke-width', 4)
                .attr('fill', 'none')

        )
    }

    // When the button is changed, run the updateChart function
    selectAll("input").on("change", function (d) {
        // recover the option that has been chosen
        var selectedOption = this.value;
        console.log(selectedOption)
        // run the updateChart function with this selected option
        update(selectedOption)
    })


}
