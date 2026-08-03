import { applyElements } from "./helpers.mjs";

export const slide08Elements = [
  {
    "type": "shape",
    "id": "10",
    "name": "Rectangle 9",
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
    "text": "EVALUATION",
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
    "text": "Internal validation supports the packaged classifier.",
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
    "text": "08",
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
    "x": 62.4,
    "y": 199.68,
    "w": 766.08,
    "h": 436.8,
    "geometry": "rect",
    "fill": "#FFFFFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "recallChart",
    "id": "9",
    "name": "Classifier recall chart",
    "x": 62.4,
    "y": 199.68,
    "w": 766.08,
    "h": 436.8
  },
  {
    "type": "shape",
    "id": "11",
    "name": "Rectangle 10",
    "x": 840.0,
    "y": 199.68,
    "w": 324.0,
    "h": 92.0,
    "geometry": "rect",
    "fill": "#FFFFFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "12",
    "name": "Rectangle 11",
    "x": 864.0,
    "y": 224.68,
    "w": 132.0,
    "h": 42.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "0.9805",
    "fontSize": 26.25,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "13",
    "name": "Rectangle 12",
    "x": 864.0,
    "y": 264.0,
    "w": 250.0,
    "h": 22.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "best-model recall",
    "fontSize": 12.0,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "14",
    "name": "Rectangle 13",
    "x": 840.0,
    "y": 297.36,
    "w": 324.0,
    "h": 188.0,
    "geometry": "rect",
    "fill": "#FFFFFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "15",
    "name": "Rectangle 14",
    "x": 864.0,
    "y": 329.36,
    "w": 240.0,
    "h": 28.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Confusion matrix",
    "fontSize": 16.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "16",
    "name": "Rectangle 15",
    "x": 864.0,
    "y": 371.36,
    "w": 122.0,
    "h": 38.0,
    "geometry": "rect",
    "fill": "#F0EDFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "17",
    "name": "Rectangle 16",
    "x": 874.0,
    "y": 380.36,
    "w": 102.0,
    "h": 20.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "TN 7,748",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "18",
    "name": "Rectangle 17",
    "x": 1002.0,
    "y": 371.36,
    "w": 122.0,
    "h": 38.0,
    "geometry": "rect",
    "fill": "#FFFFFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "19",
    "name": "Rectangle 18",
    "x": 1012.0,
    "y": 380.36,
    "w": 102.0,
    "h": 20.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "FP 158",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "20",
    "name": "Rectangle 19",
    "x": 864.0,
    "y": 423.36,
    "w": 122.0,
    "h": 38.0,
    "geometry": "rect",
    "fill": "#FFFFFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "21",
    "name": "Rectangle 20",
    "x": 874.0,
    "y": 432.36,
    "w": 102.0,
    "h": 20.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "FN 152",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "22",
    "name": "Rectangle 21",
    "x": 1002.0,
    "y": 423.36,
    "w": 122.0,
    "h": 38.0,
    "geometry": "rect",
    "fill": "#F0EDFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "23",
    "name": "Rectangle 22",
    "x": 1012.0,
    "y": 432.36,
    "w": 102.0,
    "h": 20.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "TP 7,649",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  }
];

export async function slide08(presentation, ctx) {
  const slide = presentation.slides.add();
  await applyElements(slide, ctx, slide08Elements);
  return slide;
}
