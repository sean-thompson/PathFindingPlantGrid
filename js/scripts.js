// Define the number of rows and cells
const numRows = 21; // Number of rows
const numCells = 28; // Number of cells per row
const sampleSize = 3; // Size of the sample grid
const startEnergy = 10; // search start energy
const maxSampleSize = 5; //max width and height of samples to match

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

const sampleStates = {
  PERFECT_MATCH: "perefect_match",
  PARTIAL_MATCH: "partial_match",
  NO_MATCH: "no_match"
}

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
function findPaths(startRowIndex, startCellIndex) {
  var queue = [[startRowIndex, startCellIndex, startEnergy]];
  var shortestRoutes = {};
  shortestRoutes[startRowIndex] = {}
  shortestRoutes[startRowIndex][startCellIndex] = startEnergy;

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
          if (tableContents[i][j] == 0) {
            continue;
          }

          var nextWeight = tableContents[i][j];
          if (energy >= nextWeight) {
            if (!shortestRoutes[i]) {
              shortestRoutes[i] = {};
            }

            if (!shortestRoutes[i][j]) {
              shortestRoutes[i][j] = 0;
            }

            let prevEnergy = shortestRoutes[i][j];
            let newEnergy = energy;

            if (tableContents[rowIndex][cellIndex] != tableContents[i][j]) {
              newEnergy -= imageList[tableContents[i][j]].weight;
            }

            if (newEnergy > prevEnergy) {
              shortestRoutes[i][j] = newEnergy;
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
      table.find('tr').eq(parseInt(row)).find('td').eq(parseInt(cell)).attr('title', remainingEnergy + "(" + row + "," + cell + ")");
    }
  }

  // find all the ractangles that exist in shortestRoutes with no soil
  const rectangles = [];
  for (let height = 1; height <= maxSampleSize; height++) {
    for (let width = 1; width <= maxSampleSize; width++) {
      if (height === 1 && width === 1) {
        continue; // Skip 1x1 rectangle
      }

      // Find each of the top left corners
      for (let i = 0; i <= numRows-height; i++) {
        for (let j = 0; j <= numCells-width; j++) {

          //check to see if the entire rectangle exists
          let isRectangle = true;
          let totalEnergy = 0;
          rectangle: for (let y = i; y < i+height; y++) {

            if (!shortestRoutes[y]) {
              isRectangle = false;
              break rectangle;
            }

            for (let x = j; x < j+width; x++) {

              if (!shortestRoutes[y][x]) {
                isRectangle = false;
                break rectangle;
              }

              if (tableContents[y][x] == 0) {//soil
                isRectangle = false;
                break rectangle;
              }

              totalEnergy += shortestRoutes[y][x];
            }
          }

          if (isRectangle) {
            rectangles.push({row:i, cell:j, height:height, width:width, score:totalEnergy});
          }
        }
      }
    }
  }

  rectangles.sort((a, b) => b.score - a.score);
  let testedRectangles = [];
  let maxRemainingScore = 0;

  search: for (let n = 0; n < rectangles.length; n++) {
    const rectangle = rectangles[n];//current sample rectangle

    // find all the location where one of the rectangles could be placed such that they overlap the start position
    for (let i = startRowIndex-rectangle.height+1; i <= startRowIndex; i++) {
      if (i + rectangle.height > tableContents.length) {
        continue;
      }

      if (i < 0) {
        continue;
      }

      for (let j = startCellIndex-rectangle.width+1; j <= startCellIndex; j++) {
        
        let score = 0;

        if (j + rectangle.width > tableContents[i].length) {
          continue;
        }

        if (j < 0) {
          continue;
        }

        let sampleState = sampleStates.PERFECT_MATCH

        //compare every cell from the sample to the those positioned round the start cell to see if we have a match
        sample: for (let y = 0; y < rectangle.height; y++) {
          for (let x = 0; x < rectangle.width; x++) {

            //skip the space we're trying to grow on.
            if(i+y == startRowIndex && j+x == startCellIndex) {
              continue;
            }

            // test for a match
            if (tableContents[i+y][j+x] == tableContents[rectangle.row+y][rectangle.cell+x]) {
              score += shortestRoutes[rectangle.row+y][rectangle.cell+x];
            }
            else {
              sampleState = sampleStates.PARTIAL_MATCH;
              
              if (tableContents[i+y][j+x] != 0) {
                sampleState = sampleStates.NO_MATCH;
                break sample;
              }
            }
          }
        }

        if (sampleState == sampleStates.PERFECT_MATCH) {
          tableContents[startRowIndex][startCellIndex] = tableContents[rectangle.row+startRowIndex-i][rectangle.cell+startCellIndex-j];
          renderTable();

          break search;
        } else if (sampleState == sampleStates.PARTIAL_MATCH) {
          const testedRectangle = Object.assign({}, rectangle);

          testedRectangle.score = score;
          testedRectangle.i = i;
          testedRectangle.j = j;

          testedRectangles.push(testedRectangle);

          if (score > maxRemainingScore) {
            maxRemainingScore = score;
          }

          if (maxRemainingScore > rectangle.score) {

            testedRectangles.sort((a, b) => b.score - a.score);

            tableContents[startRowIndex][startCellIndex] = 
              tableContents[testedRectangles[0].row+startRowIndex-testedRectangles[0].i][testedRectangles[0].cell+startCellIndex-testedRectangles[0].j];
            renderTable();

            break search;
          }
        }
      }
    }
  }
}

function printSample(y, x, h, w)
{
  let s = "";

  for (let i = y; i<y+h; i++) {

    if (tableContents[i]) {
      for (let j = x; j<x+w; j++) {
        if (tableContents[i][j]) {
          s += tableContents[i][j] + " ";
        } else {
          s += "* ";
        }
      }
    }
    s += "\n"
  }

  console.log(s);
}

function renderTable() {
  for (var y = 0; y < tableContents.length; y++) {
    for (var x = 0; x < tableContents[y].length; x++) {
      if (tableContents[y][x] !== 0) {
        table.find('tr').eq(y).find('td').eq(x).css('background-color', '#63b647');
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
        table.find('tr').eq(y).find('td').eq(x).css('background-color', '#a28d48');
      } else {
        table.find('tr').eq(y).find('td').eq(x).css('background-color', '#99A74B');
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

  var progressBar = $('<div>').addClass('progress-bar');
  var proggressLength = 0;
  var coverAmount = 0;
  
  $('body').append(progressBar);
  
  function animateProgressBar() {
    progressBar.css({
      'width': '0px',
      height: '8px',
      'background-color': '#305d64'
    }); // Reset progress bar width to 0%
    
    // Animate the progress bar width to 100% over the specified duration
    progressBar.stop().animate({ width: numCells * 32 + "px" }, proggressLength, 'linear', function() {

      let eligableSoil = [];

      for (var y = 0; y < tableContents.length; y++) {
        for (var x = 0; x < tableContents[y].length; x++) {
          if (tableContents[y][x] !== 0) {
            //not soil
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
            eligableSoil.push({y:y, x:x, r:Math.random()});
          } else {
            // soil, but not near plants.
          }
        }
      }

      if (eligableSoil.length > 0) {
        const newPlants = Math.ceil(eligableSoil.length * coverAmount);

        eligableSoil.sort((a, b) => b.r - a.r);
        //console.log(eligableSoil);

        for (let i = 0; i<newPlants; i++) {
          findPaths(eligableSoil[i].y, eligableSoil[i].x);
        }
      }
        
      animateProgressBar(); // Repeat the animation
    });
  }
  
  //animateProgressBar(); // Start the initial animation

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

        // Create the select element
        var speedSelect = $('<select>', { id: 'speedDropdown' });
        var coverSelect = $('<select>', { id: 'coverDropdown' });

        // Define the options
        var speedOptions = [
          { value: '0', text: 'Stopped' },
          { value: '10000', text: 'Slow' },
          { value: '5000', text: 'Medium' },
          { value: '2000', text: 'Fast' }
        ];
        var coverOptions = [
          { value: '0', text: 'None' },
          { value: '0.01', text: 'One' },
          { value: '0.1', text: 'Some' },
          { value: '0.25', text: 'Many' },
          { value: '1', text: 'All' }
        ];
  
        // Add options to the select element
        speedOptions.forEach(function(option) {
          $('<option>', {
            value: option.value,
            text: option.text
          }).appendTo(speedSelect);
        });
        coverOptions.forEach(function(option) {
          $('<option>', {
            value: option.value,
            text: option.text
          }).appendTo(coverSelect);
        });
  
        // Append the select element to the body
        $('body').append(speedSelect);
        $('body').append(coverSelect);
  
        // Event handler for the dropdown change
        speedSelect.change(function() {
          var selectedValue = parseInt($(this).val()); // Get the selected option value

          if (selectedValue == 0) {
            progressBar.stop(); 
          } else {
            proggressLength = selectedValue;
            animateProgressBar();
          }
        });
        coverSelect.change(function() {
          coverAmount = parseFloat($(this).val()); // Get the selected option value
          console.log('coverSelect option:', coverAmount);
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

    //add the tree image
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
