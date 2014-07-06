//copy to /js directory will automatically reload
//http://localhost:8080/api/helloworld
hijk.api.helloworld = function() {
    return  "Hello World!";
};
hijk.api.helloworld2 = function() {
    return {MSG: 'Hello World!'};
};
hijk.api.helloworld3 = function() {
    return  "<h3>Hello World!</h3>";
};

//http://localhost:8080/api/get?id=99&name=andy
hijk.api.get = function(map, request, response) {
    var msg = {
        url: request.getRequestURI()
    };
    for (var x in map) {
        msg[x] = map[x][0];
    }
    return msg;
};

// socket = new WebSocket('ws://localhost:8080/api/ws_helloname');
// web scoket , open two browsers
var ws_hellonameusers = JType.map();
hijk.api.ws_helloname = function(socket, request, response) {
    socket.onclose(function() {
        ws_hellonameusers.remove(socket.uid);
    });
    ws_hellonameusers.put(socket.uid, socket);

    socket.name = "";
    var sendall = function(msg) {
        //notice all online users 
        for (var id in ws_hellonameusers) {
            if (ws_hellonameusers[id] !== socket) {
                var y = ws_hellonameusers[id];
                if (y) {
                    y.send(msg + " From " + socket.name + socket.remoteid);
                }
            }
        }
    };

    socket.send("Name: ")
            .onmessage(function(name) {
                socket.name = name;
                sendall("Welcome " + name);
                socket.send("Hello " + name + " message:")
                //return new onmessage handler
                return function(msg) {
                    if (msg === "close") {
                        socket.close();
                    } else {
                        sendall("Message: " + msg);
                    }
                }
            });

};


// api bridge
hijk.api.helloworld_bridge = function() {
    var msg = JType.http.get("http://localhost:8080/api/helloworld");
    return "Bridge:" + msg;
}
hijk.api.get_bridge = function() {
    var msg = JType.http.post("http://localhost:8080/api/get", {name: 'Andy', id: 100});
    return "Bridge:" + msg;
};

//table will automatically created
hijk.table.table1 = {
    data: {"id": 0, "name": ""},
    key: ["id"],
    index: [["name"]]
};

hijk.api.table1_insert = function() {
    //insert unstructured data, only 'id' is mattered
    //key and indexes are Type-Sensitive, x.getClass() == y.getClass()
    //dynamic columns supported
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

hijk.api.table1_select = function() {
    var r = hijk.db.select("from table1");
    return r;
};

hijk.api.table1_select_sum = function() {
    var r = 0;
    hijk.db.select("from table1", [],
            function(v) {
                r += v.id;
                return true;
            });
    return r;
};
hijk.api.table1_select_name = function(map) {
    var name;
    if (map.name) {
        name = map.name[0];
    } else {
        name = "name1";
    }
    var r = hijk.db.select("from table1 where name == ?", [name]);
    return r;
};
hijk.api.table1_selectcount = function() {
    return hijk.db.selectCount("from table1", []);
};
hijk.api.table1_selectkey = function(map) {
    var id;
    if (map.id) {
        id = JType.int(map.id[0]);
    } else {
        id = 1;
    }
    return hijk.db.selectKey("table1", id);
};
hijk.api.table1_update = function(map) {
    var v = hijk.api.table1_selectkey(map);
    if (!v) {
        return null;
    }
    //clone object
    v = v.clone();
    v.fieldA = Date.now();
    if (hijk.db.update("table1", v)) {
        return v;
    } else {
        return null;
    }
};
hijk.api.table1_replace = function(map) {
    var id;
    if (map.id) {
        id = JType.int(map.id[0]);
    } else {
        id = 1;
    }
    var v = {
        id: id,
        name: "name" + id,
        fieldA: "replace" + id,
        fieldB: Date.now()
    };
    if (hijk.db.replace("table1", v)) {
        return id;
    } else {
        return -1;
    }
};

hijk.api.table1_delete = function(map) {
    var id;
    if (map.id) {
        id = JType.int(map.id[0]);
    } else {
        id = 1;
    }
    if (hijk.db.delete("table1", id)) {
        return id;
    } else {
        return -1;
    }
};

//database transaction
hijk.api.table1_tran_insert = function() {
    var r = [];
    if (hijk.db.cube(
            function(box) {
                for (var i = 0; i < 2; i++) {
                    var tid = box.id();
                    var v = {
                        id: tid,
                        name: "tran" + tid,
                        fieldA: "fieldA" + tid,
                        fieldB: "fieldB" + tid
                    };
                    box.insert("table1", v);
                    r.push(tid);
                }
                // return true to commit
                return true;
            }) === "OK") {
        return r;
    }
};

hijk.api.table1_tran_select_sum = function(map) {
    var name;
    if (map.name) {
        name = map.name[0];
    } else {
        name = null;
    }
    var r = 0;
    hijk.db.cube(
            function(box) {
                box.select("from table1 where name >= ?", [name],
                        function(v) {
                            r += v.id;
                        });
            });
    return r;
};


hijk.api.table1_tran_selectcount = function(map) {
    var name;
    if (map.name) {
        name = map.name[0];
    } else {
        name = null;
    }
    var r = 0;
    hijk.db.cube(
            function(box) {
                r = box.selectCount("from table1 where name >= ?", [name]);
            });
    return r;
};

hijk.api.table1_tran_update = function(map) {
    var id;
    if (map.id) {
        id = JType.int(map.id[0]);
    } else {
        id = 1;
    }
    var v;
    if (hijk.db.cube(
            function(box) {
                v = box.selectKey("table1", id);
                if (!v) {
                    return false;
                }
                //clone data for update
                v = v.clone();
                v.fieldA = Date.now();
                box.update("table1", v);
                return true;
            }) === "OK") {
        return v;
    } else {
        return null;
    }
};

hijk.api.table1_tran_delete = function(map) {
    var id;
    if (map.id) {
        id = JType.int(map.id[0]);
    } else {
        id = 1;
    }
    if (hijk.db.cube(
            function(box) {
                if (box.delete("table1", id)) {
                    return true;
                }
            }) === "OK") {
        return id;
    } else {
        return -1;
    }
};

// table2 composite key
hijk.table.table2 = {
    data: {"typeid": 0, "sn": 0, "name": ""},
    key: ["typeid", "sn"],
    index: []
};

hijk.api.table2_insert = function() {
    var typeid = JType.Random.nextInt(3) + 1;
    var sn = hijk.db.id(typeid);
    var v = {
        typeid: typeid,
        sn: sn,
        name: "ck" + typeid + "-" + sn,
        mycolumn: "myvalue"
    };
    if (hijk.db.insert("table2", v)) {
        return [typeid, sn];
    } else {
        return [-1, -1];
    }
};

hijk.api.table2_select = function() {
    var r = hijk.db.select("from table2");
    return r;
};

//http://localhost:8080/api/table2_selectkey?typeid=?&sn=?
hijk.api.table2_selectkey = function(map) {
    var typeid;
    var sn;
    if (map.typeid && map.sn) {
        typeid = JType.int(map.typeid[0]);
        sn = JType.int(map.sn[0]);
        return hijk.db.selectKey("table2", [typeid, sn]);
    }
};

//Multi-Thread
hijk.api.multi_thread = function() {
    var results = JType.bqueue(2);

    //Thread 1
    JType.thread(function() {
        var c = 1;
        for (var i = 1; i <= 10000; i++) {
            c += i;
            JType.sleep(0);
        }
        results.put("T01-" + c);
    });

    //Thread 2
    JType.thread(function() {
        var c = 1;
        for (var i = 10001; i <= 20000; i++) {
            c += i;
            JType.sleep(0);
        }
        results.put("T02-" + c);
    });

    var rs = [];
    var bg = Date.now();
    rs.push(results.take());
    rs.push(results.take());
    rs.push(Date.now() - bg);

    return rs;
};

//Distributed Programming 
hijk.api.ws_eval = function(socket, request) {
    socket.onmessage(function(script) {
        var fun = eval("(" + script + ")");
        return fun();
    }, socket);//using argument to pass socket for remote function
};

function start_remote_process(ws_eval_address, main_function_onremote) {
    var node = JType.socket(ws_eval_address);
    var fun_code = main_function_onremote.toString();
    node.send(fun_code);
    return node;
}

hijk.api.processes = function()
{
    // two consoles
    // jjs build.js -- 8080 0
    // jjs build.js -- 9090 0
    // run8080
    // run9090
    if (hijk.server.port !== 8080) {
        return "use http://localhost:8080/api/processes";
    }

    var remote_process = start_remote_process("ws://localhost:9090/api/ws_eval",
            function() {
                print("");
                print("hi, i'm here, this function runs on 9090 not 8080");
                return function(msg, socket) {
                    var obj = JSON.parse(msg);
                    switch (obj.action) {
                        case "ping":
                            print("i'm sending pong " + obj.msg);
                            socket.send("pong " + obj.msg);
                            break;
                        case "script":
                            eval("(" + obj.msg + ")();");
                            break;
                        case "running":
                            socket.send("i'm running");
                            break;
                        case "close":
                            socket.close();
                            print('closed');
                            break;
                    }
                };
            }
    );

    print("");
    remote_process.send({action: 'ping', msg: 'hello'});

    remote_process.send({action: 'script',
        msg: function() {
            print("show time and send back");
            var dt = new Date();
            print(JSON.stringify(dt));
            socket.send(dt);
        }.toString()});

    remote_process.send({action: 'running'})
            .onmessage(function(msg) {
                print(msg);
            });

    remote_process.send({action: 'close'});

    return "check consoles";
};