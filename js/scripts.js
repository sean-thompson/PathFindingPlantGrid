// Define the number of rows and cells
const numCells = 14; // Number of cells per row
const numRows = 13; // Number of rows
const sampleSize = 3; // Size of the sample grid
const startEnergy = 10;

let sampleArray = []; // Array to store the changed samples

let element;//closest element to mouse
let offsetX;//closest parent td to mouse index
let offsetY;//closest parent tr to mouse index

let table;//the garden
let tableContents = [];

// Predefined list of images to switch between
const imageList = [
  {image:"./img/dirt.png", weight:99999},
  {image:"./img/bluebells.png", weight:2},
  {image:"./img/bracken.png", weight:1},
  {image:"./img/brambles.png", weight:3},
  {image:"./img/cottongrass.png", weight:1},
  {image:"./img/moss.png", weight:1},
  {image:"./img/mushrooms.png", weight:2},
  {image:"./img/wildgarlic.png", weight:2}
];

//trees
const trees = {
  "oak":
    {"data":[[0,7,1,7,0],[7,1,7,7,1],[7,7,5,7,7],[7,1,7,1,7],[0,7,1,7,0]],
      "ox":26, "oy":55, "location":"./img/oaktree.png"},
  "birch":
    {"data":[[0,2,2,2,0],[2,6,2,2,6],[2,2,6,2,2],[2,2,2,2,2],[0,2,2,6,0]],
    "ox":20, "oy":45, "location":"./img/silverbirch.png"},
  "pine":
    {"data":[[0,3,4,4,0],[4,4,4,3,4],[3,4,3,4,3],[4,4,3,4,4],[0,4,4,3,0]],
    "ox":25, "oy":55, "location":"./img/pinetree.png"}
}

function createTable(){
  // Create the table element
  table = $("<table>").addClass("my-table");
  
  // Create the table rows with data
  for (var i = 0; i < numRows; i++) {
    tableContents.push([]);
    var row = $("<tr>");

    // Add cells with images
    for (var j = 0; j < numCells; j++) {
      tableContents[i].push(0);
      var cell = $("<td>");
      var imageIndex = 0; // First image in imageList is soil
      var imageSrc = imageList[imageIndex].image;
      var image = $("<img>").attr("src", imageSrc);

      image.width("32px");
      image.height("32px");

      // Click event to swap the plant
      image.on("click", function() {
        console.log(offsetX, offsetY);
        findPaths(offsetY, offsetX);
      });

      // Click event to return to soil
      image.on('contextmenu', function(event) {
        event.preventDefault(); // Prevent the default context menu behavior
    
        tableContents[offsetY][offsetX] = 0;
        renderTable();
      });

      cell.append(image);
      row.append(cell);
    }

    table.append(row);
  }

  // Append the table to the body
  $("body").append(table);
  return table;
}

//finds the shortest route to each surrounding plant
//note - calculates the wrong distance to the node you pass to it, because it walks away then back; but that doesn't affect any of the patterns
function findPaths(startRowIndex, startCellIndex) {
  var queue = [[startRowIndex, startCellIndex, startEnergy]];
  var shortestRoutes = {};

  while (queue.length > 0) {
    var current = queue.shift();
    var rowIndex = current[0];
    var cellIndex = current[1];
    var energy = current[2];

    for (var i = rowIndex - 1; i <= rowIndex + 1; i++) {
      for (var j = cellIndex - 1; j <= cellIndex + 1; j++) {
        if (i === rowIndex && j === cellIndex) {
          continue;
        }

        if (i >= 0 && i < tableContents.length && j >= 0 && j < tableContents[i].length) {
          var nextWeight = tableContents[i][j];
          if (energy >= nextWeight) {
            if (!shortestRoutes[i]) {
              shortestRoutes[i] = {};
            }

            if (!shortestRoutes[i][j]) {
              shortestRoutes[i][j] = 0;
            }

            let prevEnergy = shortestRoutes[i][j];
            let newEnergy = energy - imageList[tableContents[i][j]].weight;
            if (newEnergy > prevEnergy) {
              shortestRoutes[i][j] = newEnergy
              queue.push([i, j, newEnergy]);
            }
          }
        }
      }
    }
  }

  //clear current titles
  $('table td').removeAttr('title');

  // Update the table with remaining energy values
  for (var row in shortestRoutes) {
    for (var cell in shortestRoutes[row]) {
      var remainingEnergy = shortestRoutes[row][cell];
      table.find('tr').eq(parseInt(row)).find('td').eq(parseInt(cell)).attr('title', remainingEnergy);
    }
  }

  console.log("shortest routes", shortestRoutes);
}

function renderTable() {
  for (var y = 0; y < tableContents.length; y++) {
    for (var x = 0; x < tableContents[y].length; x++) {
      if (tableContents[y][x] !== 0) {
        table.find('tr').eq(y).find('td').eq(x).css('background-color', 'cyan');
      } else if (
        (y > 0 && tableContents[y - 1][x] !== 0) || // Above
        (y > 0 && x > 0 && tableContents[y - 1][x - 1] !== 0) || // Above Left
        (x > 0 && tableContents[y][x - 1] !== 0) || // Left
        (y < tableContents.length - 1 && x > 0 && tableContents[y + 1][x - 1] !== 0) || // Below Left
        (y < tableContents.length - 1 && tableContents[y + 1][x] !== 0) || // Below
        (y < tableContents.length - 1 && x < tableContents[y].length - 1 && tableContents[y + 1][x + 1] !== 0) || // Below Right
        (x < tableContents[y].length - 1 && tableContents[y][x + 1] !== 0) || // Right
        (y > 0 && x < tableContents[y].length - 1 && tableContents[y - 1][x + 1] !== 0) // Above Right
      ) {
        table.find('tr').eq(y).find('td').eq(x).css('background-color', 'yellow');
      } else {
        table.find('tr').eq(y).find('td').eq(x).css('background-color', 'magenta');
      }

      const cellImage = table.find("tr").eq(y).find("td").eq(x).find("img");
      const src = imageList[tableContents[y][x]].image;

      if (cellImage.attr("src") !== src) {
        cellImage.hide();
        cellImage.attr("src", src);
        cellImage.fadeIn();
      }
    }
  }
}

$(document).ready(function() {

  const table = createTable();

  //key presses
  let mouseX, mouseY;

  $(document).mousemove(function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    element = $(document.elementFromPoint(mouseX, mouseY));
    offsetX = element.closest("td").index();
    offsetY = element.closest("tr").index();
  });

  //trees
  $(document).keydown(function(event) {
    let image, dx, dy, scale, data;

    if (event.key === "q") {
      image = $('<img>', {
        src: trees.oak.location
      });
      dx = -trees.oak.ox;
      dy = -trees.oak.oy;
      scale = trees.oak.scale;
      data = trees.oak.data;
    } else if (event.key === "w") {
      image = $('<img>', {
        src: trees.birch.location
      });
      dx = -trees.birch.ox;
      dy = -trees.birch.oy;
      scale = trees.birch.scale;
      data = trees.birch.data;
    } else if (event.key === "e") {
      image = $('<img>', {
        src: trees.pine.location
      });
      dx = -trees.pine.ox;
      dy = -trees.pine.oy;
      scale = trees.pine.scale;
      data = trees.pine.data;
    } else if(event.key >= 1 && event.key <= 7) {
      var cellImage = table.find("tr").eq(offsetY).find("td").eq(offsetX).find("img");

      tableContents[offsetY][offsetX] = event.key;
    } else {
      return;
    }

    //add the tree imahge
    if (image) {
      image.css({
        position: 'absolute',
        left: mouseX+dx+'px',
        top: mouseY+dy+'px',
        "z-index": mouseY+dy+1000,
        "pointer-events": "none",
        opacity: 0.9
      });

      $("body").append(image);

      //add the associated plants

      for (var x = 0; x < 5; x++) {
        for (var y = 0; y < 5; y++) {
          var cellImage = table.find("tr").eq(y+offsetY-2).find("td").eq(x+offsetX-2).find("img");

          if(cellImage.attr("src") == imageList[0].image && y+offsetY-2 >= 0 && x+offsetX-2 >= 0){
            tableContents[y+offsetY-2][x+offsetX-2] = data[x][y];
          }
        }
      }
    }

    renderTable();
  });
});
