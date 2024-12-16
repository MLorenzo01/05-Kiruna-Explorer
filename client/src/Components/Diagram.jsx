import React, { useState, useEffect, useRef } from "react";
import API from "../API/API.mjs";
import * as d3 from "d3";
import { max } from "d3-array";
import { areLinksOverlapping } from "./utils/DiagramUtils";

// Constants
const NODE_RADIUS = 10;
const LINE = d3.line().curve(d3.curveBasis); // Bezier curve for connections
const MARGIN = { top: 50, right: 50, bottom: 60, left: 150 };
const RELATIONSHIP_STYLES = {
    "Direct Consequence": "0", // Solid line
    "Collateral Consequence": "8, 5", // Dashed line
    Prevision: "2, 2", // Dotted line
    Update: "2, 5, 10, 5", // Dash-dotted line
};

// Function to process the documents and return the nodes and links
const processDocuments = (documents) => {
    const scales = new Map();
    const nodes = [];
    const links = [];
    const seenConnections = new Set(); // Set to store unique connections
    const minYear =
        Math.min(...documents.map((doc) => new Date(doc.issuanceDate).getFullYear())) - 1;
    const maxYear = Math.max(...documents.map((doc) => new Date(doc.issuanceDate).getFullYear()));
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

    documents.forEach((doc) => {
        const issuanceDate = new Date(doc.issuanceDate);
        const year = issuanceDate.getFullYear();

        // Vertical scale
        let scaleKey = doc.scaleType;
        if (doc.scaleType === "Plan") {
            scaleKey = doc.scaleValue;
        }
        if (!scales.has(scaleKey)) {
            scales.set(scaleKey, scales.size);
        }

        // Add nodes
        nodes.push({
            id: doc.id,
            title: doc.title,
            year,
            date: doc.issuanceDate,
            scale: scaleKey,
            type: doc.type,
            stakeholders: doc.stakeholders,
        });

        // Add connections
        doc.connections.forEach((connection) => {
            const source = doc.id;
            const target = connection.targetDocument.id;
            const relationship = connection.relationship;

            // Create a unique key for the connection
            const connectionKey = [source, target].sort().join("-") + "-" + relationship;

            // Add connection only if it's not already seen
            if (!seenConnections.has(connectionKey)) {
                seenConnections.add(connectionKey);
                links.push({ source, target, relationship });
            }
        });
    });

    return { nodes, links, scales: Array.from(scales.keys()), years };
};

export default function Diagram() {
    const [documents, setDocuments] = useState([]);
    const svgRef = useRef();
    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
    });

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                const response = await API.getDocuments();
                setDocuments(response.documents);
            } catch (error) {
                console.log(error);
            }
        };
        fetchDocuments();
    }, []);

    useEffect(() => {
        const { nodes, links, scales, years } = processDocuments(documents);

        // Main graph
        const width = dimensions.width - MARGIN.left - MARGIN.right;
        const height = dimensions.height - 60 - MARGIN.top - MARGIN.bottom;

        const svg = d3.select(svgRef.current);

        svg.selectAll("*").remove();

        // Define the clipping path
        svg.append("defs")
            .append("clipPath")
            .attr("id", "clip")
            .append("rect")
            .attr("width", width)
            .attr("height", height);

        const g = svg
            .attr("width", width + MARGIN.left + MARGIN.right)
            .attr("height", height + MARGIN.top + MARGIN.bottom)
            .append("g")
            .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

        const gClip = g.append("g").attr("clip-path", "url(#clip)");

        // Tooltip to show document title on hover (hidden by default)
        const titleTooltip = d3
            .select("body")
            .append("div")
            .attr("class", "titleTooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("opacity", 1)
            .style("display", "none")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px");

        // Tooltip for connections
        const linkTooltip = d3
            .select("body")
            .append("div")
            .attr("class", "linkTooltip")
            .style("position", "absolute")
            .style("z-index", "10")
            .style("visibility", "hidden")
            .style("opacity", 1)
            .style("display", "none")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("pointer-events", "none");

        // Scales
        const xScale = d3
            .scaleTime()
            .domain([new Date(years[0], 0, 1), new Date(years[years.length - 1], 11, 31)])
            .range([0, width]);

        const yScale = d3.scaleBand().domain(scales).range([0, height]);

        // white alternating columns
        const yearColumns = gClip
            .selectAll(".year-column")
            .data(years.filter((y) => y % 2 === 0))
            .enter()
            .append("rect")
            .attr("class", "year-column")
            .attr("x", (d) => xScale(new Date(d, 0, 1)))
            .attr("y", 0)
            .attr("width", xScale(new Date(years[1], 0, 1)) - xScale(new Date(years[0], 0, 1)))
            .attr("height", height)
            .attr("fill", "white")
            .attr("opacity", 0.2);

        // Horizontal lines
        g.selectAll(".horizontal-grid")
            .data(scales)
            .enter()
            .append("line")
            .attr("class", "horizontal-grid")
            .attr("x1", (d, i) => ((d[0] !== "1" || scales[i - 1][0]) !== "1" ? -80 : 0))
            .attr("x2", width)
            .attr("y1", (d) => (yScale(d) % 1 === 0.0 ? yScale(d) + 0.5 : yScale(d))) // add 0.5 to avoid weird graphical glitches
            .attr("y2", (d) => (yScale(d) % 1 === 0.0 ? yScale(d) + 0.5 : yScale(d))) // add 0.5 to avoid weird graphical glitches
            .attr("stroke", "black")
            .attr("stroke-width", "2");

        // Axis
        const xAxis = g.append("g").call(d3.axisTop(xScale));
        const yAxis = g.append("g").call(d3.axisLeft(yScale));
        // Style for axis lines
        g.selectAll(".domain, .tick line").attr("stroke-width", 2); // Increase axis line thickness
        // Style for axis labels (ticks)
        g.selectAll(".tick text").style("font-size", "14px").style("font-weight", "bold"); // Increase font size for axis labels

        // Add title "Plan" in the middle of the "1:n" scales
        const planLabels = scales.filter((d) => d.startsWith("1:"));
        if (planLabels.length > 0) {
            const middleY =
                (yScale(planLabels[0]) + yScale(planLabels[planLabels.length - 1])) / 2 +
                yScale.bandwidth() / 2;

            g.append("text")
                .attr("x", -80)
                .attr("y", middleY)
                .attr("text-anchor", "end")
                .style("font-size", "14px")
                .style("font-weight", "bold")
                .style("font-family", "sans-serif")
                .text("Plan");
        }

        // Function to update the graph on zoom
        const updateGraph = (event) => {
            const transform = event.transform;
            const newXScale = transform.rescaleX(xScale);

            // Update the axes
            xAxis.call(d3.axisTop(newXScale).ticks(d3.timeYear.every(1)));
            g.selectAll(".tick line").attr("stroke-width", 2);
            g.selectAll(".tick text").style("font-size", "14px").style("font-weight", "bold");

            // Update the positions of the nodes and links
            gClip.selectAll(".node").attr("cx", (d) => newXScale(new Date(d.date)));

            gClip.selectAll(".link").attr("d", (d) => {
                const sourceNode = nodes.find((n) => n.id === d.source);
                const targetNode = nodes.find((n) => n.id === d.target);

                const sourceX = newXScale(new Date(sourceNode.date));
                const sourceY = sourceNode.y;
                const targetX = newXScale(new Date(targetNode.date));
                const targetY = targetNode.y;

                // Control point for the Bezier curve
                const controlPointX =
                    Math.min(sourceX, targetX) + Math.abs(sourceX - targetX) * 0.2;
                const controlPointY = (sourceY + targetY) / 2 + Math.abs(sourceY - targetY) * 0.4;

                return LINE([
                    [sourceX, sourceY],
                    [controlPointX, controlPointY],
                    [targetX, targetY],
                ]);
            });

            gClip.selectAll(".link-hitbox").attr("d", (d) => {
                const sourceNode = nodes.find((n) => n.id === d.source);
                const targetNode = nodes.find((n) => n.id === d.target);

                const sourceX = newXScale(new Date(sourceNode.date));
                const sourceY = sourceNode.y;
                const targetX = newXScale(new Date(targetNode.date));
                const targetY = targetNode.y;

                // Control point for the Bezier curve
                const controlPointX =
                    Math.min(sourceX, targetX) + Math.abs(sourceX - targetX) * 0.2;
                const controlPointY = (sourceY + targetY) / 2 + Math.abs(sourceY - targetY) * 0.4;

                return LINE([
                    [sourceX, sourceY],
                    [controlPointX, controlPointY],
                    [targetX, targetY],
                ]);
            });

            // Update the positions and widths of the year columns
            yearColumns
                .attr("x", (d) => newXScale(new Date(d, 0, 1)))
                .attr(
                    "width",
                    newXScale(new Date(years[1], 0, 1)) - newXScale(new Date(years[0], 0, 1))
                );
        };

        // Add zoom behavior
        const zoom = d3
            .zoom()
            .scaleExtent([1, 10])
            .translateExtent([
                [0, 0],
                [width, height],
            ])
            .extent([
                [0, 0],
                [width, height],
            ])
            .on("zoom", updateGraph);

        svg.call(zoom);

        // Group nodes by scale and date
        const nodesByScaleAndDate = d3.group(nodes, (d) => `${d.scale}-${d.date}`);

        // Adjust y-coordinates of nodes to avoid overlapping
        nodes.forEach((d) => {
            const nodesInSameScaleAndDate = nodesByScaleAndDate.get(`${d.scale}-${d.date}`);
            const index = nodesInSameScaleAndDate.findIndex((node) => node.id === d.id);
            const offset = (index - (nodesInSameScaleAndDate.length - 1) / 2) * (NODE_RADIUS * 3);
            d.y = yScale(d.scale) + yScale.bandwidth() / 2 + offset;
        });

        // Connection
        // Create visible links
        gClip
            .selectAll(".link")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link")
            .attr("d", (d) => {
                const sourceNode = nodes.find((n) => n.id === d.source);
                const targetNode = nodes.find((n) => n.id === d.target);

                const sourceX = xScale(new Date(sourceNode.date));
                const sourceY = sourceNode.y;
                const targetX = xScale(new Date(targetNode.date));
                const targetY = targetNode.y;

                // Control point for the Bezier curve
                const controlPointX =
                    Math.min(sourceX, targetX) + Math.abs(sourceX - targetX) * 0.2;
                const controlPointY = (sourceY + targetY) / 2 + Math.abs(sourceY - targetY) * 0.4;

                return LINE([
                    [sourceX, sourceY],
                    [controlPointX, controlPointY],
                    [targetX, targetY],
                ]);
            })
            .attr("stroke", "black")
            .attr("stroke-width", 3)
            .attr("stroke-dasharray", (d) => RELATIONSHIP_STYLES[d.relationship] || "0")
            .attr("fill", "none");

        // Create invisible hitboxes for links
        gClip
            .selectAll(".link-hitbox")
            .data(links)
            .enter()
            .append("path")
            .attr("class", "link-hitbox")
            .attr("d", (d) => {
                const sourceNode = nodes.find((n) => n.id === d.source);
                const targetNode = nodes.find((n) => n.id === d.target);

                const sourceX = xScale(new Date(sourceNode.date));
                const sourceY = sourceNode.y;
                const targetX = xScale(new Date(targetNode.date));
                const targetY = targetNode.y;

                // Control point for the Bezier curve
                const controlPointX =
                    Math.min(sourceX, targetX) + Math.abs(sourceX - targetX) * 0.2;
                const controlPointY = (sourceY + targetY) / 2 + Math.abs(sourceY - targetY) * 0.4;

                return LINE([
                    [sourceX, sourceY],
                    [controlPointX, controlPointY],
                    [targetX, targetY],
                ]);
            })
            .attr("fill", "none")
            .attr("stroke", "transparent") // Invisible line
            .attr("stroke-width", 20) // Enlarged hitbox
            .on("mouseover", (event, d) => {
                const nearbyLinks = links.filter((link) =>
                    areLinksOverlapping(d, link, nodes, xScale)
                );

                if (nearbyLinks.length > 0) {
                    // Mostra il tooltip solo per i link sovrapposti
                    linkTooltip
                        .style("visibility", "visible")
                        .style("display", "block")
                        .html(
                            `<div>
                            ${nearbyLinks
                                .map((link) => {
                                    const sourceNode = nodes.find((n) => n.id === link.source);
                                    const targetNode = nodes.find((n) => n.id === link.target);
                                    return `
                                    <div>
                                        <strong>Connection:</strong> ${link.relationship} <br>
                                        <strong>From:</strong> ${sourceNode.title} <br>
                                        <strong>To:</strong> ${targetNode.title}
                                    </div>`;
                                })
                                .join("<br/>")}
                        </div>`
                        )
                        .style("left", event.clientX + 20 + "px")
                        .style("top", event.clientY - 10 + "px");

                    const tooltipRect = linkTooltip.node().getBoundingClientRect();
                    const windowWidth = window.innerWidth;
                    const windowHeight = window.innerHeight;

                    if (tooltipRect.right > windowWidth) {
                        linkTooltip.style("left", `${windowWidth - tooltipRect.width - 20}px`);
                    }

                    if (tooltipRect.bottom > windowHeight) {
                        linkTooltip.style("top", `${windowHeight - tooltipRect.height - 20}px`);
                    }

                    // Evidenzia i link sovrapposti
                    gClip
                        .selectAll(".link")
                        .filter((link) => nearbyLinks.includes(link))
                        .attr("stroke", "red")
                        .attr("stroke-width", 3);
                } else {
                    linkTooltip.style("visibility", "hidden");
                }
            })
            .on("mouseout", () => {
                linkTooltip.style("visibility", "hidden");
                gClip.selectAll(".link").attr("stroke", "black").attr("stroke-width", 3);
            });

        // Nodes
        gClip
            .selectAll(".node")
            .data(nodes)
            .enter()
            .append("circle")
            .attr("class", "node")
            .attr("cx", (d) => max([xScale(new Date(d.date)), NODE_RADIUS]))
            .attr("cy", (d) => d.y)
            .attr("r", NODE_RADIUS)
            .attr("fill", (d) => (d.stakeholders.length ? d.stakeholders[0].color : "#000"))
            .on("mouseover", (event, d) => {
                const rect = svgRef.current.getBoundingClientRect(); // Get SVG position
                titleTooltip
                    .style("display", "block")
                    .style("visibility", "visible")
                    .text(d.title)
                    .style(
                        "left",
                        `${
                            rect.left + MARGIN.left + parseFloat(d3.select(event.target).attr("cx"))
                        }px`
                    )
                    .style(
                        "top",
                        `${
                            rect.top +
                            MARGIN.top +
                            parseFloat(d3.select(event.target).attr("cy") - NODE_RADIUS - 5)
                        }px`
                    )
                    .style("transform", "translate(-50%, -100%)");

                // Change border color
                d3.select(event.target).attr("stroke", "white").attr("stroke-width", 2);
                // Move the hovered node to the front
                d3.select(event.target).raise();
            })
            .on("mouseout", (event) => {
                titleTooltip.style("visibility", "hidden");
                // Reset border color
                d3.select(event.target).attr("stroke", "none");
            });

        return () => {
            titleTooltip.remove();
            linkTooltip.remove();
            g.selectAll("*").remove();
        };
    }, [documents, dimensions]);

    return <svg ref={svgRef}></svg>;
}