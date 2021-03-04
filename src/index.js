/* 
Data Vis Project
*/

import { select } from 'd3-selection';
import { json } from 'd3-fetch';
import { extent } from 'd3-array';
import { scaleLog, scaleOrdinal } from 'd3-scale';
import { axisTop, axisRight } from 'd3-axis';
import { format, schemePaired } from 'd3';

// Read Data and call Scatter plot function

json("../data/survey_relevant.json")
    .then((dataset, error) => {
        if (error) {
            return console.warn(error);
        } else {
            lineplot(dataset);
        }
    });
//Scatter plot function

//Define fixed variables
const height = 600;
const width = 600;
const margin = { top: 200, bottom: 200, right: 200, left: 200 };
const plotWidth = width - margin.left - margin.right;
const plotHeight = height - margin.top - margin.bottom;

//Code from lectures
function unique(data, key) {
    return Array.from(data.reduce((acc, row) => {
        return acc.add(row[key])
    }, new Set()))
};

function lineplot(data) {

    console.log(data)

}



