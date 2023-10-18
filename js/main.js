

async function fetchData(){
    const url = "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326";
    const response = await fetch(url);
    if (!response.ok){
        throw console.error("Error while fetching");
    }
    return data = await response.json();
}

async function onLoad(){
    const data = await fetchData();
    const population = await getPopulation();
    const educationData = await GetChartData();
    const names = population.dimension.Alue.category.label;
    const populationArrays = makeArrays(population.value);
    
    let map = L.map('map', {
        minZoom: -3
    });
    let backgroundMap = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 21,
        attribution: "© OpenStreetMap"
    }).addTo(map)
    let currentClicked = null;
    let layer = L.geoJSON(data, {
        weight: 2,
        style: function(feature){
            
            
            return {color: `blue`}
        },

        onEachFeature: function GetFeature(feature, layer){
            const areaCode = getKeyByName(names, feature.properties.name)
            layer.on({
                click: function (e){
                    if (currentClicked) {
                        resetLayer(currentClicked);
                    }
                    createCharts(feature.properties.name,populationArrays,population.dimension.Alue.category.index[areaCode],educationData);
                    layer.setStyle({ // changes clicked area to green
                        color: 'green'
                    })
                    currentClicked = layer;
                    
                    
                }
            })
        
            
            
             layer.bindTooltip(feature.properties.nimi +"<br>Population: "+ populationArrays.total[population.dimension.Alue.category.index[areaCode]])

            

        }
        
    }).addTo(map);
    map.fitBounds(layer.getBounds());
}


// Resets the layer color to blue
function resetLayer(layer){
    layer.setStyle({
        color: 'blue'
    })
}


// Create chart for the desired location
async function createCharts(name, populationArrays, index,educationData){
    const mapElement = document.getElementById('map');
    mapElement.style.height = '50vh';
    let Button = document.getElementById('myButton');
    let calculateButton = document.getElementById('calculateButton');
    let exportButton = document.getElementById('exportButton');
    if (!Button){
      const buttons = makeButton()
       Button=  buttons.button;
       calculateButton = buttons.calculateButton;
       exportButton = buttons.exportButton;
       
    }
    

    const chart=buildChart(populationArrays, index,name );
    const eduChart =await educationChart(name, index,educationData);
    Button.addEventListener('click', () => window.location.reload());
    calculateButton.addEventListener('click',() =>updateChart(eduChart,populationArrays.total[index], chart));
    exportButton.addEventListener('click', () => {chart.export(); eduChart.export()});

} 


//function to make buttons
function makeButton(){
    const parentdiv= document.getElementById('titleAndButtons');
    
    const button = document.createElement('button');
    button.classList.add('buttons');
    button.textContent = 'back to full map';
    button.id = 'myButton';
    const calculateButton = document.createElement('button');
    calculateButton.classList.add('buttons');
    calculateButton.textContent = 'Calculate % of population';
    calculateButton.id = 'calculateButton';
    const exportButton = document.createElement('button');
    exportButton.classList.add('buttons');
    exportButton.textContent = 'Export charts';
    exportButton.id = 'exportButton';

    parentdiv.appendChild(calculateButton);
    parentdiv.appendChild(button);
    parentdiv.appendChild(exportButton);
    

    return {button,calculateButton, exportButton}
}


// fetch call to get data about population
async function getPopulation(){
    const url = "https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/vaerak/statfin_vaerak_pxt_11re.px";
    const response = await fetch(url,{
        method: "POST",
        headers: {"content-type":"application/json"},
        body: JSON.stringify(jsonQuery),
    });
    
    if (!response.ok){
      throw console.error("Error while fetching");
    }
    return data = await response.json();
    
}


// finds area code for with the name
function getKeyByName(population, name) {
    for (const key in population) {
      if (population.hasOwnProperty(key) && population[key] === name) {
        return key;
      }
    }
    return 
  }
//separate population to total, men and female arrays



function makeArrays(data){
    let total = []
    let men = []
    let female=[]
    
    let j = "t";
    for (i=0;i<data.length; i++){
        
        if (j=="t"){
            total.push(data[i])
            j="m";
            continue;

            
        }
        if (j=="m"){

            men.push(data[i])
            j="f"
            continue;
        }
        if(j=="f")
            female.push(data[i])
            j="t"
            continue
        }

        
    
    return {total, men, female}
}



// build the actuial chart with given data
function buildChart(populationArrays, index, name){
    const chartsTitle =document.getElementById("chartTitle");
    chartsTitle.innerText=`Statistics from ${name}`;
    
    let chart = new frappe.Chart( "#chart", { // or DOM element
        data: {
        labels: ["Male","Female"],
    
        datasets: [
            
            {
                name: "",
                
                values: [populationArrays.men[index],populationArrays.female[index]]
            }
        ],
    
       
        },
        
        title: "Population by sex",
        type: 'bar',
        height: 370,
        
        colors: ["#46FE06"],
        
    
        
      });
      return chart;
}




async function educationChart(name,index,educationData){
 
  const calculatedIndex = (index*9);
  const value = [];
  for (i=calculatedIndex; i<(calculatedIndex+9); i++){ value.push(educationData.value[i])};
 //labels come in wrong order for some reason and have to be adjustet to their place 
  const array= Object.values(educationData.dimension.Koulutusaste.category.label);
  let shiftedValues = [array[array.length-1], array[array.length-2]]
  array.unshift(shiftedValues[0]);
  array.unshift(shiftedValues[1]);
  array.splice(array.length-2, 2);

  for (i=1; i<array.length; i++){if(i==1){array[i]=array[i].substring(4)}else{ array[i]=array[i].substring(2) }};
  
  let chart = new frappe.Chart( "#EducationChart", { // or DOM element
    data: {
    labels: array,

    datasets: [
        
        {
            name: "",
            
            values: value
        }
    ],

   
    },
    spaceRatio:1,
    title: `Education level of ${name}`,
    type: 'line',
    height: 370,
    
    colors: ["#46FE06"]

    
  });
  return chart;
  
  
}



function exportCharts(chart,genderChart){
  console.log("moi");
  chart.export();
  genderChart.export();
}




function updateChart(chart,population, genderChart){
  
  if( chart.data.datasets[0].values[0]<100){
    return 
  }
  const genderLabels = genderChart.data.labels;
  const percentGenderValues = genderChart.data.datasets[0].values;
  const array = chart.data.labels;
  const percentvalues = chart.data.datasets[0].values;
   
  for (i=0; i<percentvalues.length;i++){percentvalues[i]=(percentvalues[i]/population)*100};
  
  const educationData= {
    labels:array,

    datasets: [
        
        {
            name: "",
            
            values: percentvalues
        }
    ],

    }
  const genderData ={
    labels: genderLabels,
    datasets: [
      {
        name: "",
        
        values:[(percentGenderValues[0]/population)*100,(percentGenderValues[1]/population)*100] 
    }
    ]
  }
  genderChart.update(genderData);
  chart.update(educationData);
  
}




async function GetChartData(){
  const url = 'https://statfin.stat.fi:443/PxWeb/api/v1/en/StatFin/vkour/statfin_vkour_pxt_12bq.px'
  
  const response = await fetch(url,{
    method: "POST",
    headers: {"content-type":"application/json"},
    body: JSON.stringify(educationQuery),
  });
  if (!response.ok){
    throw console.error("Error while fetching");
  }
  return  data  =  await response.json();

}


onLoad()