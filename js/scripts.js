  // Define the number of rows and cells
  const numCells = 14; // Number of cells per row
  const numRows = 13; // Number of rows
  const sampleSize = 3; // Size of the sample grid
  let sampleArray = []; // Array to store the changed samples

  let element;//closest element to mouse
  let offsetX;//closest parent td to mouse index
  let offsetY;//closest parent tr to mouse index

  let table;//the garden

  // Predefined list of images to switch between
  const imageList = [
    "./img/dirt.png",
    "./img/bluebells.png",
    "./img/bracken.png",
    "./img/brambles.png",
    "./img/cottongrass.png",
    "./img/moss.png",
    "./img/mushrooms.png",
    "./img/wildgarlic.png"
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
    var row = $("<tr>");

    // Add cells with images
    for (var j = 0; j < numCells; j++) {
      var cell = $("<td>");
      var imageIndex = 0; // First image in imageList is soil
      var imageSrc = imageList[imageIndex];
      var image = $("<img>").attr("src", imageSrc);

      image.width("32px");
      image.height("32px");

      // Click event to swap the plant
      image.on("click", function() {
        var currentIndex = imageList.indexOf($(this).attr("src"));
        var nextIndex = currentIndex % (imageList.length-1) + 1;
        $(this).hide();
        $(this).attr("src", imageList[nextIndex]);
        $(this).fadeIn();
      });

      // Click event to return to soil
      image.on('contextmenu', function(event) {
        event.preventDefault(); // Prevent the default context menu behavior
    
        $(this).attr("src", imageList[0]);
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

function updateSoil() {
  // Find all <td> elements within the table
  var $tdElements = table.find('td');

  // Iterate through each <td> element
  $tdElements.each(function() {
    // Check if the <td> contains an image
    var $imgElements = $(this).find('img');
    if ($imgElements.length > 0) {
      var hasDirtImage = $imgElements.filter(function() {
        return $(this).attr('src') === imageList[0];
      }).length > 0;

      // Change the background color of the <td> to yellow
      if (!hasDirtImage) {
        $(this).css('background-color', 'sandybrown');
      } else {
         // Find all <td> elements within the table
        var $tdElements = table.find('td');

        // Iterate through each <td> element
        $tdElements.each(function() {
          // Check if the <td> contains an image
          var $imgElements = $(this).find('img');
          if ($imgElements.length > 0 && $imgElements.attr('src') === './img/dirt.png') {
            var rowIndex = this.parentNode.rowIndex;
            var cellIndex = this.cellIndex;

            var hasAdjacentDirtImage = false;

            // Check if any adjacent <td> elements contain the dirt image
            // Above
            if (rowIndex > 0) {
              var $aboveTD = table.find('tr').eq(rowIndex - 1).find('td').eq(cellIndex);
              if ($aboveTD.find('img').length === 0 || $aboveTD.find('img').attr('src') !== './img/dirt.png') {
                hasAdjacentDirtImage = true;
              }
            }

            // Below
            if (rowIndex < table.find('tr').length - 1) {
              var $belowTD = table.find('tr').eq(rowIndex + 1).find('td').eq(cellIndex);
              if ($belowTD.find('img').length === 0 || $belowTD.find('img').attr('src') !== './img/dirt.png') {
                hasAdjacentDirtImage = true;
              }
            }

            // Left
            if (cellIndex > 0) {
              var $leftTD = $(this).prev('td');
              if ($leftTD.find('img').length === 0 || $leftTD.find('img').attr('src') !== './img/dirt.png') {
                hasAdjacentDirtImage = true;
              }
            }

            // Right
            if (cellIndex < $(this).siblings('td').length) {
              var $rightTD = $(this).next('td');
              if ($rightTD.find('img').length === 0 || $rightTD.find('img').attr('src') !== './img/dirt.png') {
                hasAdjacentDirtImage = true;
              }
            }

            // Change the background color of the <td> to saddlebrown if no adjacent <td> contains the dirt image
            if (hasAdjacentDirtImage) {
              $(this).css('background-color', 'saddlebrown');
            }
          }
        });
      }
    }
  });
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

      if(offsetY >= 0 && offsetX >= 0){
        cellImage.hide();
        cellImage.attr("src", imageList[event.key]);
        cellImage.fadeIn();
      }
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

            if(cellImage.attr("src") == imageList[0] && y+offsetY-2 >= 0 && x+offsetX-2 >= 0){
              cellImage.hide();
              cellImage.attr("src", imageList[data[x][y]]);
              cellImage.fadeIn();
            }
        }
      }
    }

    updateSoil();
  });
});
