import { applyElements } from "./helpers.mjs";

export const slide10Elements = [
  {
    "type": "shape",
    "id": "18",
    "name": "Rectangle 17",
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
    "x": 64.0,
    "y": 38.0,
    "w": 28.0,
    "h": 6.0,
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
    "x": 104.0,
    "y": 27.0,
    "w": 420.0,
    "h": 30.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "QUESTIONS",
    "fontSize": 12.75,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos",
    "align": "left",
    "valign": "middle"
  },
  {
    "type": "text",
    "id": "4",
    "name": "Rectangle 3",
    "x": 64.0,
    "y": 78.0,
    "w": 1060.0,
    "h": 116.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Cloud Email Analyzer turns inbound mail into traceable security evidence.",
    "fontSize": 36.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "5",
    "name": "Rectangle 4",
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
    "id": "6",
    "name": "Rectangle 5",
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
    "id": "7",
    "name": "Rectangle 6",
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
    "text": "10",
    "fontSize": 9.0,
    "color": "#617089",
    "bold": false,
    "typeface": "Aptos",
    "align": "right",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "8",
    "name": "Rectangle 7",
    "x": 82.0,
    "y": 242.0,
    "w": 820.0,
    "h": 2.0,
    "geometry": "rect",
    "fill": "#6A4DFF",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    }
  },
  {
    "type": "shape",
    "id": "9",
    "name": "Rectangle 8",
    "x": 118.0,
    "y": 301.0,
    "w": 8.0,
    "h": 8.0,
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
    "id": "10",
    "name": "Rectangle 9",
    "x": 138.0,
    "y": 292.0,
    "w": 600.0,
    "h": 56.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "AWS-oriented event boundary",
    "fontSize": 18.0,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "11",
    "name": "Rectangle 10",
    "x": 118.0,
    "y": 359.0,
    "w": 8.0,
    "h": 8.0,
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
    "id": "12",
    "name": "Rectangle 11",
    "x": 138.0,
    "y": 350.0,
    "w": 660.0,
    "h": 56.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "ML classification plus attachment scanning",
    "fontSize": 18.0,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "13",
    "name": "Rectangle 12",
    "x": 118.0,
    "y": 417.0,
    "w": 8.0,
    "h": 8.0,
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
    "id": "14",
    "name": "Rectangle 13",
    "x": 138.0,
    "y": 408.0,
    "w": 760.0,
    "h": 56.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Authenticated user/admin review with audit records",
    "fontSize": 18.0,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "15",
    "name": "Rectangle 14",
    "x": 118.0,
    "y": 520.0,
    "w": 800.0,
    "h": 30.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Andreescu Ovidiu-Ștefan · Anghelea Andrei · Sîrbu-Boeți Eduard-Cristian",
    "fontSize": 14.25,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "16",
    "name": "Rectangle 15",
    "x": 118.0,
    "y": 556.0,
    "w": 560.0,
    "h": 28.0,
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
  {
    "type": "text",
    "id": "17",
    "name": "Rectangle 16",
    "x": 118.0,
    "y": 586.0,
    "w": 620.0,
    "h": 28.0,
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
  }
];

export async function slide10(presentation, ctx) {
  const slide = presentation.slides.add();
  await applyElements(slide, ctx, slide10Elements);
  return slide;
}
