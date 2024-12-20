import { boundingExtent } from "ol/extent";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource, Cluster } from "ol/source";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Stroke, Icon, Text, Fill, Circle } from "ol/style";
import { GeoJSON } from "ol/format";
import { getIconForType } from "./iconUtils";

function getRandomPointNearAreaCenter(area) {
    const centerLat = parseFloat(area.centerLat);
    const centerLon = parseFloat(area.centerLon);
    const geojson = area.geojson;

    // Calculate extent of the area in geographic coordinates
    const geometryExtent = boundingExtent(geojson.coordinates[0]); // Assumes Polygon or MultiPolygon
    const [minX, minY, maxX, maxY] = geometryExtent.map((coord) => toLonLat([coord])[0]);

    // Calculate the maximum offsets (10% of the extent size)
    const MIN_OFFSET = 0.001; // Minimum offset for small areas
    const latOffsetRange = Math.max((maxY - minY) * 0.1, MIN_OFFSET);
    const lonOffsetRange = Math.max((maxX - minX) * 0.1, MIN_OFFSET);

    // Generate random offsets
    const randomLatOffset = (Math.random() - 0.5) * 2 * latOffsetRange;
    const randomLonOffset = (Math.random() - 0.5) * 2 * lonOffsetRange;

    // Calculate the random point near the center
    const randomLat = centerLat + randomLatOffset;
    const randomLon = centerLon + randomLonOffset;

    return [randomLon, randomLat];
}

export const createDocumentLayer = (allDocuments, iconMap) => {
    const features = allDocuments
        .map((doc) => {
            let location;
            if (doc.longitude !== null && doc.latitude !== null) {
                location = fromLonLat([doc.longitude, doc.latitude]);
            } else if (doc.area) {
                if (doc?.area?.centerLat && doc?.area?.centerLon) {
                    location = fromLonLat(getRandomPointNearAreaCenter(doc.area));
                }
            }

            if (!location) return null; // Skip if no valid coordinates

            const feature = new Feature({
                geometry: new Point(location),
                documentId: doc.id,
                documentTitle: doc.title,
                documentType: doc.type,
                documentStakeholders: doc.stakeholders,
            });

            const img = new Image();

            // if length of stakeholders is equal to 1, get the color of the first stakeholder, else use purple
            const docColor = doc.stakeholders?.length === 1 ? doc.stakeholders[0].color : "purple";
            img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
                getIconForType(doc.type, docColor)
            )}`;
            img.onload = () => {
                const initialStyle = new Style({
                    image: new Icon({
                        anchor: [0.5, 0.5],
                        img: img,
                        scale: 0.5,
                        imgSize: [img.width, img.height],
                        //color: doc.stakeholders?.[0]?.color || "purple",
                    }),
                });
                feature.setStyle(initialStyle);
                feature.initialStyle = initialStyle;
                feature.previousStyle = initialStyle;
            };

            return feature;
        })
        .filter((feature) => feature !== null);

    const vectorSource = new VectorSource({ features });
    const clusterSource = new Cluster({
        distance: 70, // Set the distance for clustering
        source: vectorSource,
    });

    // Defines the style for the cluster
    const clusterLayer = new VectorLayer({
        name: "documentLayer",
        zIndex: 10,
        source: clusterSource,
        style: (feature) => {
            const features = feature.get("features");
            const size = features.length; // Number of elements in the cluster

            // If there is only one document in the cluster, show the specific icon
            if (size === 1) {
                const singleFeature = features[0];
                return singleFeature.getStyle();
            }
            // Otherwise, it shows a red circle for the cluster
            return new Style({
                image: new Circle({
                    radius: 17,
                    fill: new Fill({
                        color: "rgba(255, 0, 0, 0.4)", // Transparent red circle
                    }),
                    stroke: new Stroke({
                        color: "#ff0000",
                        width: 2,
                    }),
                }),
                text: new Text({
                    text: size.toString(),
                    font: "bold 14px sans-serif",
                    fill: new Fill({ color: "#fff" }),
                    stroke: new Stroke({
                        color: "#000",
                        width: 3,
                    }),
                }),
            });
        },
    });

    return clusterLayer;
};

export function handleMapPointerMove({
    mapInstanceRef,
    hoveredFeatureRef,
    isSelectingCoordinates,
    allDocuments,
}) {
    const map = mapInstanceRef.current;

    // Improve the hover event, this not working properly

    /*const docId = hoveredFeatureRef.current?.get("documentId");
    console.log(docId);
    const matchedDocument = allDocuments.find((doc) => doc.id === docId);
    const docColor = matchedDocument?.stakeholders?.length === 1 ? matchedDocument.stakeholders[0].color : "purple";
    */

    const hoverSource = new VectorSource();
    const hoverLayer = new VectorLayer({
        source: hoverSource,
        style: new Style({
            stroke: new Stroke({
                color: "rgba(255, 165, 0, 0.8)", // Colore per l'effetto hover
                width: 3,
            }),
            fill: new Fill({
                color: "rgba(255, 165, 0, 0.2)", // Colore per l'effetto hover
            }),
        }),
        zIndex: 3,
    });

    map.addLayer(hoverLayer);

    const handlePointerMove = (event) => {
        hoverSource.clear();
        if (isSelectingCoordinates) {
            setCursorStyle("pointer");
        } else {
            const hit = map.hasFeatureAtPixel(event.pixel);
            setCursorStyle(hit ? "pointer" : "");
            handleFeatureHover(event.pixel);
            if (hit) handleHoverLayer(event.pixel);
        }
    };

    const setCursorStyle = (style) => {
        map.getTargetElement().style.cursor = style;
    };

    const handleFeatureHover = (pixel) => {
        const featureAtPixel = findFeatureAtPixel(pixel, "documentLayer");

        if (featureAtPixel /*&& !featureAtPixel.get("clicked")*/) {
            const features = featureAtPixel.get("features"); // Get cluster features
            if (features?.length > 1) {
                // It is a cluster, we do not apply the specific hover style
                resetHighlightedFeature();
            } else {
                // It is a single feature
                const singleFeature = features[0];
                updateFeatureHighlight(singleFeature);
            }
        } else {
            resetHighlightedFeature();
        }
    };

    const findFeatureAtPixel = (pixel, layerName) => {
        return map.forEachFeatureAtPixel(pixel, (feature, layer) => {
            if (layer?.get("name") === layerName) return feature;
        });
    };

    const updateFeatureHighlight = (feature) => {
        if (hoveredFeatureRef.current !== feature) {
            resetHighlightedFeature();
            applyHoverStyle(feature);
            hoveredFeatureRef.current = feature;
        }
    };

    const resetHighlightedFeature = () => {
        if (hoveredFeatureRef.current) {
            hoveredFeatureRef.current.setStyle(hoveredFeatureRef.current.previousStyle);
            hoveredFeatureRef.current = null;
        }
    };

    const applyHoverStyle = (feature) => {
        const currentStyle = feature.getStyle();
        const title = feature.get("documentTitle");
        const docId = feature.get("documentId");
        const doc = findMatchedDocument(docId);
        const docColor = doc.stakeholders?.length === 1 ? doc.stakeholders[0].color : "purple";
        const img = new Image();
        img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
            getIconForType(doc.type, docColor, true)
        )}`;
        img.onload = () => {
            feature.setStyle(
                new Style({
                    image: new Icon({
                        anchor: [0.5, 0.5],
                        img: img,
                        scale: 0.55,
                        imgSize: [img.width, img.height],
                    }),
                    text: new Text({
                        text: title,
                        font: "13px Arial",
                        offsetY: -35,
                        fill: new Fill({
                            color: "#fff",
                        }),
                        backgroundFill: new Fill({
                            color: "rgba(0, 0, 0, 0.8)",
                        }),
                        padding: [2, 0, 0, 2],
                        textAlign: "center",
                        textBaseline: "middle",
                        backgroundStroke: new Stroke({
                            color: "rgba(0, 0, 0, 0.9)",
                            width: 10,
                            lineCap: "round",
                            lineJoin: "round",
                        }),
                    }),
                    zIndex: 1000,
                })
            );
        };
    };

    const handleHoverLayer = (pixel) => {
        const feature = map.forEachFeatureAtPixel(pixel, (f) => f);
        if (!feature) return;

        // Checks whether the feature is a cluster
        const featuresInCluster = feature.get("features");
        const isCluster = Array.isArray(featuresInCluster);

        if (isCluster) {
            // Itera on features in the cluster
            featuresInCluster.forEach((individualFeature) => {
                handleFeature(individualFeature);
            });
        } else {
            // Normal management for a single feature
            handleFeature(feature);
        }
    };

    const handleFeature = (feature) => {
        if (feature?.get("documentId")) {
            const documentId = feature.get("documentId");
            const matchedDocument = findMatchedDocument(documentId);
            if (matchedDocument?.areaId && matchedDocument?.area?.geojson) {
                addGeoJSONToHoverSource(matchedDocument.area.geojson);
            }
        }
    };

    const findMatchedDocument = (documentId) => {
        return allDocuments.find((doc) => doc.id === documentId);
    };

    const addGeoJSONToHoverSource = (geojson) => {
        const geojsonFormat = new GeoJSON();
        try {
            const areaFeatures = geojsonFormat.readFeatures(geojson, {
                featureProjection: "EPSG:3857",
            });
            hoverSource.addFeatures(areaFeatures);
        } catch (error) {
            console.error("Error parsing GeoJSON for hover:", error);
        }
    };

    // Attach and detach the pointermove event
    map.on("pointermove", handlePointerMove);

    return () => {
        map.un("pointermove", handlePointerMove);
        map.removeLayer(hoverLayer);
    };
}

export const resetPreviousFeatureStyle = (clickedFeatureRef) => {
    if (clickedFeatureRef.current) {
        const previousFeature = clickedFeatureRef.current;
        const initialStyle = previousFeature.initialStyle;
        previousFeature.previousStyle = initialStyle;
        if (initialStyle) {
            previousFeature.setStyle(initialStyle);
        }
        previousFeature.set("clicked", false);
        clickedFeatureRef.current = null;
    }
};

export const applyClickStyle = (feature) => {
    const docColor =
        feature.get("documentStakeholders")?.length === 1
            ? feature.get("documentStakeholders")[0].color
            : "purple";
    const img = new Image();
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(
        getIconForType(feature.get("documentType"), docColor, true)
    )}`;

    img.onload = () => {
        const newStyle = new Style({
            image: new Icon({
                anchor: [0.5, 0.5],
                img: img,
                scale: 0.5,
                imgSize: [img.width, img.height],
            }),
            zIndex: 3,
        });

        feature.setStyle(newStyle);
        feature.previousStyle = newStyle;
        feature.set("clicked", true);
    };
};
