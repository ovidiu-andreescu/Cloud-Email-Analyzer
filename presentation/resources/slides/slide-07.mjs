import { applyElements } from "./helpers.mjs";

export const slide07Elements = [
  {
    "type": "shape",
    "id": "41",
    "name": "Rectangle 40",
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
    "text": "EVIDENCE MODEL",
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
    "text": "Separate artifacts from review state.",
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
    "text": "07",
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
    "x": 84.0,
    "y": 232.0,
    "w": 410.0,
    "h": 286.0,
    "geometry": "rect",
    "fill": "#F9FBFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "9",
    "name": "Rectangle 8",
    "x": 110.0,
    "y": 258.0,
    "w": 360.0,
    "h": 28.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "S3 artifact store",
    "fontSize": 16.5,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "10",
    "name": "Rectangle 9",
    "x": 128.0,
    "y": 306.0,
    "w": 320.0,
    "h": 58.0,
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
    "id": "11",
    "name": "Rectangle 10",
    "x": 140.0,
    "y": 319.0,
    "w": 296.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Raw MIME",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "12",
    "name": "Rectangle 11",
    "x": 156.0,
    "y": 339.44,
    "w": 264.0,
    "h": 21.12,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "original inbound object",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "13",
    "name": "Rectangle 12",
    "x": 128.0,
    "y": 378.0,
    "w": 320.0,
    "h": 58.0,
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
    "id": "14",
    "name": "Rectangle 13",
    "x": 140.0,
    "y": 391.0,
    "w": 296.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Parsed body",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "15",
    "name": "Rectangle 14",
    "x": 158.0,
    "y": 411.82,
    "w": 264.0,
    "h": 21.12,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "plain text and HTML evidence",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "16",
    "name": "Rectangle 15",
    "x": 128.0,
    "y": 450.0,
    "w": 320.0,
    "h": 58.0,
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
    "id": "17",
    "name": "Rectangle 16",
    "x": 140.0,
    "y": 463.0,
    "w": 296.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Attachment files",
    "fontSize": 13.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "18",
    "name": "Rectangle 17",
    "x": 157.0,
    "y": 483.32,
    "w": 264.0,
    "h": 21.12,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "extracted binary artifacts",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "19",
    "name": "Rectangle 18",
    "x": 548.0,
    "y": 354.0,
    "w": 132.0,
    "h": 72.0,
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
    "id": "20",
    "name": "Rectangle 19",
    "x": 559.968,
    "y": 367.008,
    "w": 108.0,
    "h": 29.952,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Pointers",
    "fontSize": 15.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "21",
    "name": "Rectangle 20",
    "x": 559.968,
    "y": 398.016,
    "w": 108.0,
    "h": 18.048,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "+ verdicts",
    "fontSize": 11.25,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "23",
    "name": "Graphic 22",
    "x": 500.0,
    "y": 390.0,
    "w": 45.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "nativeArrow",
    "id": "25",
    "name": "Graphic 24",
    "x": 679.968,
    "y": 390.0,
    "w": 49.392,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "26",
    "name": "Rectangle 25",
    "x": 734.0,
    "y": 232.0,
    "w": 462.0,
    "h": 286.0,
    "geometry": "rect",
    "fill": "#F9FBFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "text",
    "id": "27",
    "name": "Rectangle 26",
    "x": 760.0,
    "y": 258.0,
    "w": 410.0,
    "h": 28.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "DynamoDB review state",
    "fontSize": 16.5,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "28",
    "name": "Rectangle 27",
    "x": 760.0,
    "y": 306.0,
    "w": 178.0,
    "h": 78.0,
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
    "id": "29",
    "name": "Rectangle 28",
    "x": 772.0,
    "y": 319.0,
    "w": 154.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Message ledger",
    "fontSize": 12.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "30",
    "name": "Rectangle 29",
    "x": 770.48,
    "y": 343.182,
    "w": 155.52,
    "h": 23.04,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "status · verdicts · links",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "31",
    "name": "Rectangle 30",
    "x": 976.0,
    "y": 306.0,
    "w": 178.0,
    "h": 78.0,
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
    "id": "32",
    "name": "Rectangle 31",
    "x": 988.0,
    "y": 319.0,
    "w": 154.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Inbox projection",
    "fontSize": 12.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "33",
    "name": "Rectangle 32",
    "x": 983.72,
    "y": 343.182,
    "w": 155.52,
    "h": 23.04,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "per-user review rows",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "34",
    "name": "Rectangle 33",
    "x": 760.0,
    "y": 418.0,
    "w": 178.0,
    "h": 78.0,
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
    "id": "35",
    "name": "Rectangle 34",
    "x": 772.0,
    "y": 431.0,
    "w": 154.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Attachments",
    "fontSize": 12.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "36",
    "name": "Rectangle 35",
    "x": 772.0,
    "y": 452.46,
    "w": 155.52,
    "h": 23.04,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "hash · scan verdict",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "37",
    "name": "Rectangle 36",
    "x": 976.0,
    "y": 418.0,
    "w": 178.0,
    "h": 78.0,
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
    "id": "38",
    "name": "Rectangle 37",
    "x": 988.0,
    "y": 431.0,
    "w": 154.0,
    "h": 24.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Audit records",
    "fontSize": 12.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "39",
    "name": "Rectangle 38",
    "x": 976.0,
    "y": 454.558,
    "w": 176.48,
    "h": 20.942,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "actor · action · metadata",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "40",
    "name": "Rectangle 39",
    "x": 152.0,
    "y": 572.0,
    "w": 976.0,
    "h": 54.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Dashboard requests compact state first, then retrieves large artifacts through authorized API calls.",
    "fontSize": 15.75,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  }
];

export async function slide07(presentation, ctx) {
  const slide = presentation.slides.add();
  await applyElements(slide, ctx, slide07Elements);
  return slide;
}
