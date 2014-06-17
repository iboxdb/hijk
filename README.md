###hijk Javascript WebAPI Development Package

####Getting Started

#####Start Development Service

1. set PATH to /JAVA **8**_HOME/bin
2. **jjs** build.js
3. run

 
#####Write a Javascript File demo.js

```
hijk.api.helloworld = function() {
    return  "Hello World!";
};
hijk.api.helloworld2 = function() {
    return {MSG: 'Hello World!'};
};
hijk.api.helloworld3 = function() {
    return  "<h3>Hello World!</h3>";
};
```

copy demo.js to ./js/ directory, service will automatically load javascript files when it is changed.

open browser input http://localhost:8080/api/helloworld

use /edit/js/demo.js can edit files online, 

![PIC](https://github.com/iboxdb/hijk/raw/master/html/images/HIJK.png)
