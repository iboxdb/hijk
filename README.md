###hijk Javascript WebAPI Development Package

####Getting Started

#####Start Development Service

1. set PATH to /JAVA **8**_HOME/bin
2. **jjs** build.js
3. run.bat

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
            request("/api/helloworld2", function(o) { alert(o.MSG); });
        }
        function request(api, fun) {
            var req = new XMLHttpRequest();
            req.open("GET", api, true);
            req.onreadystatechange = function() {
                if (req.readyState === 4 && (req.status === 304 || req.status === 200)) {
                    var o = eval("(" + req.responseText + ")");
                    fun(o);
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

####WebAPI Arguments

```
hijk.api.get = function(map,request) {
    var msg = {
        url: request.getRequestURI(),
        id : map.id[0],
        name: map.name[0] 
    };
    return msg;
};
```

1. save
2. open browser and input http://localhost:8080/api/get?id=99&name=andy

####WebSocket WebAPI

```
hijk.api.ws_helloname = function(socket, request, response) {
    socket.send("Name: ")
          .onmessage(function(name) { 
                sendall("Welcome " + name); 
          });
};
```

####JSON HTML Page Template
```
<div>
  <h3>Hello {{name}} !</h3>
  {{#keys}}
    <p> {{key}}={{value}} </p>
  {{/keys}}
</div>

<script>
   DoRender({
     name: "World",
     keys: [{key: 'mydb', value: 25}, {key: 'yourdb', value: 35}]
   });
</script>     
```        

####Dynamic HTML Function
```
hijk.api["/table1_template.html"] = function(file, map, request) {
    function demo_server_template_processor(html, json) {
        html = html.replaceFirst("<head>",
                "<head><title>Server Process -" + json.record.name + "</title>" +
                "<meta name='keywords' content='HIJK JavaScript WebAPI " + json.record.id + "' />" +
                "<meta name='Description' content='HIJK HTML WebAPI Demo for template' />");
        return html;
    }
    var html = file.html;
    var json = hijk.api.table1_template_json(map, request);
    html = demo_server_template_processor(html, json);
    return html;
}
```

####Define Database's Table

```
hijk.table.table1 = {
    data: {"id": 0, "name": ""},
    key: ["id"],
    index: [["name"]]
}
```

####Insert Object to Table

```
hijk.api.table1_insert = function() {
    var tid = hijk.db.id();
    var v = {
        id: tid,
        name: "name" + tid,
        fieldA: "fieldA" + tid,
        fieldB: "fieldB" + tid
    };
    if (hijk.db.insert("table1", v)) {
        return tid;
    } else {
        return -1;
    }
};
```

####Read Data from Database

```
hijk.api.table1_select_sum = function() {
    var r = 0;
    hijk.db.select("from table1", [],
            function(v) {
                r += v.id; 
            });
    return r;
};
```

####More Usages
######WebAPI Bridge

```
hijk.api.get_bridge = function() {
    var msg = JType.http.post("http://localhost:8080/api/get", {name: 'Andy', id: 100});
    return "Bridge:" + msg;
};
```

######File Upload
```
hijk.api.upload = function(map, request) {
   sys.upload(request, function(file) { 
        file.write("html/uploads/newname.png" );
    });
};
```

######JavaScript Multi-Thread

```
hijk.api.multi_thread = function() {
    var results = sys.threadreturn(2);

    //Thread 1
    sys.thread(function() {
        for (var i = 1; i <= 10000; i++) {       }
        results.put("T01-" + c);
    });

    //Thread 2
    sys.thread(function() { 
        for (var i = 10001; i <= 20000; i++) {   }
        results.put("T02-" + c);
    });

    var rs = [];
    var bg = Date.now();
    rs.push(results.take());
    rs.push(results.take());
    rs.push(Date.now() - bg);

    return rs;
};
```

######JavaScript Distributed Programming

```
hijk.api.processes = function()
{
    var remote_process = start_remote_process("ws://remotehost:9090/api/ws_eval",
            function() {
                print("this function runs on remote server");
                return function(msg, socket) {
                    var obj = JSON.parse(msg);
                    switch (obj.action) {
                      case "ping":
                            print("i'm sending pong " + obj.msg);
                            socket.send("pong " + obj.msg);
                            break;
                    }
                }
            });
            
    remote_process.send({action: 'ping', msg: 'hello'});        
}            
```

####Benchmark, Select Record from Database

```
Document Path:          /api/table1_selectkey?id=187663
Concurrency Level:      500
Complete requests:      100000
Failed requests:        0
Write errors:           0
Requests per second:    4829.27 [#/sec] (mean)
```


