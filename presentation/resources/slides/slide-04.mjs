import { applyElements } from "./helpers.mjs";

export const slide04Elements = [
  {
    "type": "shape",
    "id": "61",
    "name": "Rectangle 60",
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
    "text": "ARCHITECTURE",
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
    "text": "AWS services separate ingestion, processing, state, and review.",
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
    "text": "04",
    "fontSize": 9.0,
    "color": "#617089",
    "bold": false,
    "typeface": "Aptos",
    "align": "right",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "8",
    "name": "Rectangle 7",
    "x": 76.0,
    "y": 210.0,
    "w": 420.0,
    "h": 30.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Mail ingress and event boundary",
    "fontSize": 14.25,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "9",
    "name": "Rectangle 8",
    "x": 64.0,
    "y": 240.0,
    "w": 1152.0,
    "h": 112.0,
    "geometry": "rect",
    "fill": "#F9FBFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "shape",
    "id": "10",
    "name": "Rectangle 9",
    "x": 90.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "x": 102.0,
    "y": 281.0,
    "w": 104.0,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Route53",
    "fontSize": 12.0,
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
    "x": 103.119,
    "y": 298.24,
    "w": 104.0,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "MX records",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "14",
    "name": "Graphic 13",
    "x": 226.0,
    "y": 298.0,
    "w": 28.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "15",
    "name": "Rectangle 14",
    "x": 262.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "id": "16",
    "name": "Rectangle 15",
    "x": 267.84,
    "y": 281.0,
    "w": 115.2,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Amazon SES",
    "fontSize": 10.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "17",
    "name": "Rectangle 16",
    "x": 267.84,
    "y": 300.0,
    "w": 115.2,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "inbound mail",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "19",
    "name": "Graphic 18",
    "x": 398.0,
    "y": 298.0,
    "w": 28.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "20",
    "name": "Rectangle 19",
    "x": 434.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "x": 446.0,
    "y": 281.0,
    "w": 104.0,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "S3",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "22",
    "name": "Rectangle 21",
    "x": 447.04,
    "y": 299.26,
    "w": 104.0,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "raw MIME",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "24",
    "name": "Graphic 23",
    "x": 570.0,
    "y": 298.0,
    "w": 28.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "25",
    "name": "Rectangle 24",
    "x": 606.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "id": "26",
    "name": "Rectangle 25",
    "x": 618.0,
    "y": 281.0,
    "w": 104.0,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "EventBridge",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "27",
    "name": "Rectangle 26",
    "x": 618.0,
    "y": 300.287,
    "w": 104.0,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "MailReceived",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "29",
    "name": "Graphic 28",
    "x": 742.0,
    "y": 298.0,
    "w": 28.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "30",
    "name": "Rectangle 29",
    "x": 778.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "id": "31",
    "name": "Rectangle 30",
    "x": 784.32,
    "y": 281.0,
    "w": 115.2,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Step Functions",
    "fontSize": 10.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "32",
    "name": "Rectangle 31",
    "x": 782.18,
    "y": 299.1,
    "w": 115.2,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "workflow",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "34",
    "name": "Graphic 33",
    "x": 914.0,
    "y": 298.0,
    "w": 28.0,
    "h": 0,
    "direction": "right",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "35",
    "name": "Rectangle 34",
    "x": 950.0,
    "y": 268.0,
    "w": 128.0,
    "h": 60.0,
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
    "id": "36",
    "name": "Rectangle 35",
    "x": 962.0,
    "y": 281.0,
    "w": 104.0,
    "h": 31.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Lambda",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "37",
    "name": "Rectangle 36",
    "x": 952.678,
    "y": 298.24,
    "w": 124.8,
    "h": 18.24,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "parse · ML · scan",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "39",
    "name": "Graphic 38",
    "x": 1015.68,
    "y": 360.96,
    "w": 0,
    "h": 60.48,
    "direction": "down",
    "color": "#6A4DFF",
    "strokeWidth": 45.12
  },
  {
    "type": "text",
    "id": "40",
    "name": "Rectangle 39",
    "x": 76.0,
    "y": 394.0,
    "w": 460.0,
    "h": 30.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Persistence and authenticated review",
    "fontSize": 14.25,
    "color": "#6A4DFF",
    "bold": true,
    "typeface": "Aptos",
    "align": "left",
    "valign": "top"
  },
  {
    "type": "shape",
    "id": "41",
    "name": "Rectangle 40",
    "x": 64.0,
    "y": 424.0,
    "w": 1152.0,
    "h": 118.0,
    "geometry": "rect",
    "fill": "#F9FBFF",
    "line": {
      "fill": "#C7D5E6",
      "width": 1.5,
      "style": "solid"
    }
  },
  {
    "type": "shape",
    "id": "42",
    "name": "Rectangle 41",
    "x": 180.0,
    "y": 460.0,
    "w": 172.0,
    "h": 62.0,
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
    "id": "43",
    "name": "Rectangle 42",
    "x": 192.0,
    "y": 473.0,
    "w": 148.0,
    "h": 27.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "React dashboard",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "44",
    "name": "Rectangle 43",
    "x": 192.0,
    "y": 491.156,
    "w": 148.0,
    "h": 20.16,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "user/admin review",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "46",
    "name": "Graphic 45",
    "x": 362.0,
    "y": 491.0,
    "w": 49.0,
    "h": 0,
    "direction": "left",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "47",
    "name": "Rectangle 46",
    "x": 420.0,
    "y": 460.0,
    "w": 172.0,
    "h": 62.0,
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
    "id": "48",
    "name": "Rectangle 47",
    "x": 432.0,
    "y": 473.0,
    "w": 148.0,
    "h": 27.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "FastAPI",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "49",
    "name": "Rectangle 48",
    "x": 432.0,
    "y": 491.156,
    "w": 148.0,
    "h": 20.16,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "authenticated API",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "51",
    "name": "Graphic 50",
    "x": 602.0,
    "y": 491.0,
    "w": 49.0,
    "h": 0,
    "direction": "left",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "52",
    "name": "Rectangle 51",
    "x": 660.0,
    "y": 460.0,
    "w": 172.0,
    "h": 62.0,
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
    "id": "53",
    "name": "Rectangle 52",
    "x": 672.0,
    "y": 473.0,
    "w": 148.0,
    "h": 27.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "DynamoDB",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "54",
    "name": "Rectangle 53",
    "x": 672.0,
    "y": 491.156,
    "w": 148.0,
    "h": 20.16,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "ledger · inbox · audit",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "nativeArrow",
    "id": "56",
    "name": "Graphic 55",
    "x": 842.0,
    "y": 491.0,
    "w": 49.0,
    "h": 0,
    "direction": "left",
    "color": "#6A4DFF",
    "strokeWidth": 4
  },
  {
    "type": "shape",
    "id": "57",
    "name": "Rectangle 56",
    "x": 900.0,
    "y": 460.0,
    "w": 172.0,
    "h": 62.0,
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
    "id": "58",
    "name": "Rectangle 57",
    "x": 912.0,
    "y": 473.0,
    "w": 148.0,
    "h": 27.0,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "S3 artifacts",
    "fontSize": 12.0,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos Display",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "59",
    "name": "Rectangle 58",
    "x": 915.661,
    "y": 491.156,
    "w": 148.0,
    "h": 20.16,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "parsed bodies · files",
    "fontSize": 11.5,
    "color": "#3D4B63",
    "bold": false,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  },
  {
    "type": "text",
    "id": "60",
    "name": "Rectangle 59",
    "x": 170.0,
    "y": 574.08,
    "w": 940.0,
    "h": 55.68,
    "geometry": "rect",
    "fill": "#00000000",
    "line": {
      "fill": "#00000000",
      "width": 0.0,
      "style": "solid"
    },
    "text": "Raw bodies and extracted files remain in S3.\nCompact review state remains queryable in DynamoDB.",
    "fontSize": 16.5,
    "color": "#102033",
    "bold": true,
    "typeface": "Aptos",
    "align": "center",
    "valign": "top"
  }
];

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  await applyElements(slide, ctx, slide04Elements);
  return slide;
}
