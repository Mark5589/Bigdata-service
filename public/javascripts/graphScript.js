

 let cluster0Size = document.currentScript.getAttribute('cluster0Size');
 let cluster1Size = document.currentScript.getAttribute('cluster1Size');
 let cluster2Size = document.currentScript.getAttribute('cluster2Size');
 let cluster3Size = document.currentScript.getAttribute('cluster3Size');

 let cluster0Text = document.currentScript.getAttribute('cluster0Text');
 let cluster1Text = document.currentScript.getAttribute('cluster1Text');
 let cluster2Text = document.currentScript.getAttribute('cluster2Text');
 let cluster3Text = document.currentScript.getAttribute('cluster3Text');
 
 console.log('cluster0 text : '+ cluster0Text);
 console.log('cluster0 size: '+ cluster0Size);
 console.log('cluster1 : '+ cluster1Text);
 console.log('cluster2 : '+ cluster2Text);
 console.log('cluster3 : '+ cluster3Text);
//  alert(cluster0Text)
var trace1 = {
  x: [1, 2, 3, 4],
  y: [10, 11, 12, 13],
  text: [cluster0Text+'<br>cluster 1', cluster1Text+'<br>cluster 2', cluster2Text+'<br>cluster 3', cluster3Text+'<br>cluster 4' ],
  mode: 'markers',
  marker: {
    color: ['rgb(93, 164, 214)', 'rgb(255, 144, 14)',  'rgb(44, 160, 101)', 'rgb(255, 65, 54)'],
    size: [cluster0Size,
      cluster1Size,
      cluster2Size,
      cluster3Size]
  }
};
var data = [trace1];

var layout = {
  title: 'Clustering by Retails',
  showlegend: false,
  height: 600,
  width: 600
};

Plotly.newPlot('myDiv', data, layout);