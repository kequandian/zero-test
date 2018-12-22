const fs = require('fs');

const [ nodePath, scriptPath, filterString, jsonString ] = process.argv;


var filter=JSON.parse(filterString); 
var result = JSON.parse(jsonString);


/// iter filter
for(let itemKey of Object.keys(filter)){
   if(result.hasOwnProperty(itemKey)){
      result[itemKey] = filter[itemKey];
   }
}

console.log(JSON.stringify(result));

