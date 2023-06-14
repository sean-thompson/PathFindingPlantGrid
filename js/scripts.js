  // Define the number of rows and cells
  const numCells = 40; // Number of cells per row
  const numRows = 30; // Number of rows
  const sampleSize = 3; // Size of the sample grid
  let sampleArray = []; // Array to store the changed samples

  let element;//closest element to mouse
  let offsetX;//closest parent td to mouse index
  let offsetY;//closest parent tr to mouse index

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
  var table = $("<table>").addClass("my-table");
  
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

function findSamples(table){
  sampleArray = []; // Reset the sample array
  
  // Loop through the cells in the table to sample
  for (var i = 0; i <= numRows - sampleSize; i++) {
    for (var j = 0; j <= numCells - sampleSize; j++) {
      var sampleImages = [];

      // Collect the URLs of the images in the sample
      for (var x = i; x < i + sampleSize; x++) {
        for (var y = j; y < j + sampleSize; y++) {
          var cellImage = table.find("tr").eq(y).find("td").eq(x).find("img");
          sampleImages.push(cellImage.attr("src"));
        }
      }

      // Add the sample to the array if it does not contain the first image
      if (!sampleImages.includes(imageList[0])) {
        sampleArray.push(sampleImages);
      }
    }
  }

  // mirror the samples
  var n = sampleArray.length - 1;
  while (n >= 0) {
    let value = [...sampleArray[n]];
    
    for (var i = 0; i < sampleSize; i++) {
      for (var j = 0; j < Math.floor(sampleSize/2); j++) {
        [value[sampleSize*i+j], value[sampleSize*i-j+sampleSize-1]] = [value[sampleSize*i-j+sampleSize-1], value[sampleSize*i+j]];
      }
    }

    sampleArray.push(value);
    n--;
  }

  // rotate the samples
  n = sampleArray.length - 1;
  while (n >= 0) {

    let before = [...sampleArray[n]];

    for (var m = 0; m<3; m++) {
      let after = []
      
      for (var i = 0; i < sampleSize; i++) {
        for (var j = 0; j < sampleSize; j++) {
          after.push(before[sampleSize**2 + i -sampleSize*j - sampleSize])
        }
      }

      sampleArray.push(after);
      before = [...after];
    }

    n--;
  }

  // remove duuplicates
  const countMap = {};
  const uniqueSamples = [];

  // Count duplicates using an object as a dictionary
  for (const subArray of sampleArray) {
    const key = JSON.stringify(subArray);
    countMap[key] = (countMap[key] || 0) + 1;
  }

  // Copy unique sub-arrays to the new array
  for (const subArray of sampleArray) {
    const key = JSON.stringify(subArray);
    if (!uniqueSamples.some((arr) => JSON.stringify(arr) === key)) {
      uniqueSamples.push(subArray);
    }
  }

  // Return the new array with count information
  let weightedSamples = uniqueSamples.map((subArray) => ({
    value: subArray,
    count: countMap[JSON.stringify(subArray)]
  }));

  return weightedSamples;
}

function createNextGeneration(table, weightedSamples){
  // find all the possible matches for the next generation
  const nextGeneration = [];

  for (var i = 0; i <= numRows - sampleSize; i++) {
    for (var j = 0; j <= numCells - sampleSize; j++) {
      var sampleImages = [];

      // Collect the URLs of the images in the sample
      for (var x = i; x < i + sampleSize; x++) {
        for (var y = j; y < j + sampleSize; y++) {
          var cellImage = table.find("tr").eq(x).find("td").eq(y).find("img");
          sampleImages.push(cellImage.attr("src"));
        }
      }

      // Look for samples which have a mix of set images and default images
      const count = sampleImages.filter(element => element === imageList[0]).length;
      if(count > 0 && count < sampleSize ** 2) {
        for (const test of weightedSamples) {

            // record smples which can be replaced
            if(sampleImages.every((value, index) => value == test.value[index] || value == imageList[0])) {
              const plantCount = sampleSize ** 2 - sampleImages.filter(item => item == imageList[0]).length;

              nextGeneration.push({"x":i, "y":j, "weight":test.count*plantCount, "value":test.value}) // This is the format of nextGeneration - X, Y, new values

                //TODO multiply count by the number of colour (ie, not imageList[0]) squares, so adding fewer new flowers is preferred
            }
        }
      } 
    }
  }

      //orders by lowest entropy first
      nextGeneration.sort((a, b) => b.weight - a.weight);

      return nextGeneration;
}

function growNextGeneration(table, nextGeneration, chaos, isRandom, isGreedy){
  const totalWeight = nextGeneration.reduce((accumulator, obj) => accumulator + obj.weight, 0);

  //selects one random tile near the start of the pack, more likely to land on lower entropy (higher weight) items
  const target = Math.ceil(totalWeight * chaos * (isRandom ? Math.random() : 1));
  let countdown = target;

  for (const value of nextGeneration){
    countdown -= value.weight;

    let index = 0;
    if ((isGreedy && countdown > 0) || (!isGreedy && countdown <= 0)){
      for (var x = value.x; x < value.x + sampleSize; x++) {
        for (var y = value.y; y < value.y + sampleSize; y++) {
            var cellImage = table.find("tr").eq(x).find("td").eq(y).find("img");

            if(cellImage.attr("src") == imageList[0]){
              cellImage.hide();
              cellImage.attr("src", value.value[index]);
              cellImage.fadeIn();
            }
            index++;
        }
      }

      if(!isGreedy){
        break;
      }
    }
  }
}

$(document).ready(function() {

  var progressBar = $('<div>').addClass('progress-bar');
  
  $('body').append(progressBar);
  
  function animateProgressBar() {
    progressBar.css({
      'width': '0px',
      height: '8px',
      'background-color': '#305d64'
    }); // Reset progress bar width to 0%
    
    // Animate the progress bar width to 100% over the specified duration
    progressBar.animate({
      width: '1280px'
    }, 8000, 'linear', function() {
      // Animation complete callback
      const weightedSamples = findSamples(table);
      const nextGeneration = createNextGeneration(table, weightedSamples);
      growNextGeneration(table, nextGeneration, 0.9, true, false);

      animateProgressBar(); // Repeat the animation
    });
  }
  
  animateProgressBar(); // Start the initial animation

  const table = createTable();

  /*
  // grow a few plants, nice ones
  var growOneButton = $("<button>").text("Grow One").on("click", function() {
    const weightedSamples = findSamples(table);
    const nextGeneration = createNextGeneration(table, weightedSamples);
    growNextGeneration(table, nextGeneration, 0.5, true, false);
  });
  $("body").append(growOneButton);

  // entire next generation //TODO - make sure it's prioritising the best samples
  var growManyButton = $("<button>").text("Grow Many").on("click", function() {
    const weightedSamples = findSamples(table);
    const nextGeneration = createNextGeneration(table, weightedSamples);
    growNextGeneration(table, nextGeneration, 1, false, true);
  });
  $("body").append(growManyButton);

  // grow a few plants from the best sample
  var growBestButton = $("<button>").text("Grow Best").on("click", function() {
    const weightedSamples = findSamples(table);
    const nextGeneration = createNextGeneration(table, weightedSamples);
    growNextGeneration(table, nextGeneration, 0, false, false);
  });
  $("body").append(growBestButton);*/

  //key presses
  let mouseX, mouseY;

  $(document).mousemove(function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;

    element = $(document.elementFromPoint(mouseX, mouseY));
    offsetX = element.closest("td").index();
    offsetY = element.closest("tr").index();
  });

  //plants
  $(document).keydown(function(event) {
    if (event.key >= 1 && event.key <= 7) {
      var cellImage = table.find("tr").eq(offsetY).find("td").eq(offsetX).find("img");

      if(offsetY >= 0 && offsetX >= 0){
        cellImage.hide();
        cellImage.attr("src", imageList[event.key]);
        cellImage.fadeIn();
      }
    }
  })

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
      } else {
        return;
      }

      //add the tree imahge
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
  });
});
