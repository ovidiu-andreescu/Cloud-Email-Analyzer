import { applyElements } from "./helpers.mjs";

export const titleLogoItems = [
  {
    type: "identityMark",
    name: "Title logo icon mark",
    x: 817.2,
    y: 108.88,
    w: 300,
    h: 270,
  },
];

export const slide01Elements = [
  {
    "type": "shape",
    "id": "8",
    "name": "Rectangle 7",
    "x": 0.0,
    "y": 0.0,
    "w": 1280.0,
    "h": 720.0,
    "geometry": "rect",
    "fill": "#F6F9FE",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    }
  },
  {
    "type": "shape",
    "id": "2",
    "name": "Rectangle 1",
    "x": 70.0,
    "y": 96.0,
    "w": 8.0,
    "h": 128.0,
    "geometry": "rect",
    "fill": "#6A4DFF",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "3",
    "name": "Rectangle 2",
    "x": 96.0,
    "y": 86.0,
    "w": 780.0,
    "h": 58.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Cloud Email Analyzer",
    "fontSize": 31.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "4",
    "name": "Rectangle 3",
    "x": 98.0,
    "y": 146.0,
    "w": 770.0,
    "h": 42.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Serverless Email Threat Detection with AWS, ML, and ClamAV",
    "fontSize": 18.0,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "5",
    "name": "Rectangle 4",
    "x": 98.0,
    "y": 258.0,
    "w": 820.0,
    "h": 30.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Andreescu Ovidiu-Ștefan · Anghelea Andrei · Sîrbu-Boeți Eduard-Cristian",
    "fontSize": 15.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "6",
    "name": "Rectangle 5",
    "x": 98.0,
    "y": 294.0,
    "w": 720.0,
    "h": 26.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Coordinator: Prof. dr. ing. Andrei VASILĂŢEANU, DILS",
    "fontSize": 13.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "7",
    "name": "Rectangle 6",
    "x": 98.0,
    "y": 324.0,
    "w": 620.0,
    "h": 26.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "FILS · IOT 1241EC · POLITEHNICA Bucharest",
    "fontSize": 13.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  ...titleLogoItems,
  {
    "type": "shape",
    "id": "22",
    "name": "Rectangle 21",
    "x": 64.0,
    "y": 662.0,
    "w": 1152.0,
    "h": 2.0,
    "geometry": "rect",
    "fill": "#E2EAF5",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "23",
    "name": "Rectangle 22",
    "x": 64.0,
    "y": 675.0,
    "w": 300.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Cloud Email Analyzer",
    "fontSize": 9.0,
    "color": "#617089",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "24",
    "name": "Rectangle 23",
    "x": 1182.0,
    "y": 675.0,
    "w": 34.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "01",
    "fontSize": 9.0,
    "color": "#617089",
    "bold": false,
    "typeface": "Aptos",
    "align": "right",
    "valign": "top"
  }
];

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  await applyElements(slide, ctx, slide01Elements);
  return slide;
}
