###hijk Javascript WebAPI Development Package

####Getting Started

#####Start Development Service

1. set PATH to /JAVA **8**_HOME/bin
2. **jjs** build.js
3. run

 
#####Write a Javascript File, demo.js

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

1. copy demo.js to ./js/ directory, service will automatically load javascript files when it is changed.

2. open browser and input http://localhost:8080/api/helloworld

3. use /edit/js/demo.js that can edit files online, 

![PIC](https://github.com/iboxdb/hijk/raw/master/html/images/HIJK.png)


####Creating HTML to call WebAPI methods, index.html

```
<html> 
    <script  type="text/javascript">
        function hello() {
            var req = new XMLHttpRequest();
            req.open("GET", "/api/helloworld2", true);
            req.onreadystatechange = function() {
                if (req.readyState === 4 && (req.status === 200)) {
                    var o = eval("(" + req.responseText + ")");
                    alert(o.MSG);
                }
            };
            req.send();
        }
    </script>
    <body>
        <p> <img id="img1" src="" alt="" onclick="hello();"></p>
    </body>
</html>

```

1. copy index.html to ./html/ directory
2. open browser and input http://localhost:8080
3. click image
