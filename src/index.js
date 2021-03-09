/* 
Data Vis Project
*/
import '../main.css';
import { csv } from 'd3-fetch';
import { select, selectAll } from 'd3-selection';
import { nest } from 'd3-collection';
import { line, curveBasis } from 'd3-shape';
import { scaleLinear, scaleOrdinal } from 'd3-scale';
import { axisBottom, axisLeft } from 'd3-axis';
import { easeLinear, extent, schemePaired } from 'd3';
import { transition } from 'd3-transition';

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
const width = 600;
const margin = { left: 50, top: 50, bottom: 50, right: 50 };
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
        .range(schemePaired)
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


    let lines = null;
    update('Male', 0, true);


    //Update
    function update(gender, speed, first_time) {

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
            update(this.value, 1200, false);
        });

}


