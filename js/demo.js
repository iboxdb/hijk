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
    var url = request.getRequestURL().toString();
    var server = url.substring(0, url.indexOf("/api/get"));
    server = server.replaceAll("http://", "").replaceAll("https://", "");
    var msg = {
        url: url,
        server: server
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
    var results = sys.threadreturn(2);

    //Thread 1
    sys.thread(function() {
        var c = 1;
        for (var i = 1; i <= 10000; i++) {
            c += i;
            sys.sleep(0);
        }
        results.put("T01-" + c);
    });

    //Thread 2
    sys.thread(function() {
        var c = 1;
        for (var i = 10001; i <= 20000; i++) {
            c += i;
            sys.sleep(0);
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

var thread_local = sys.threadvar(null);
hijk.api.multi_thread_local = function() {
    var results = sys.threadreturn(2);

    var fun = function() {
        var param = thread_local.get();
        var start = param.start;
        var end = param.end;
        var id = param.id;
        var c = 1;
        for (var i = start; i <= end; i++) {
            c += i;
            sys.sleep(0);
        }
        results.put("T" + id + "-" + c);
    };

    //Thread 1
    sys.thread(function() {
        sys.sleep(10);
        var param = {start: 1, end: 10000, id: "L01"};
        thread_local.set(param);
        fun();
    });

    //Thread 2
    sys.thread(function() {
        sys.sleep(10);
        var param = {start: 10001, end: 20000, id: "L02"};
        thread_local.set(param);
        fun();
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
    print(socket.remoteid + " using javascript eval");
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
    remote_process.close();
    return "check consoles " + (new Date());
};

// User-Session Demo
hijk.table.user = {
    data: {id: 0, name: "", password: "", regtime: Date.now(), online: Date.now(), sessionid: ""},
    key: ["id"],
    //true = unique index
    index: [[true, "name"]],
    new_id_pos: 1
};

function UserSessionClass() {
    var Cookie = Java.type("javax.servlet.http.Cookie");

    var hijksid = 'hijksid';
    function createsid(uid) {
        return  hijksid + uid + '_' + sys.uuid();
    }

    this.register = function(name, password) {
        var c = hijk.db.selectCount("from user where name==?", name);
        if (c > 0) {
            return "exist 1";
        }
        var uid = hijk.db.id(hijk.table.user.new_id_pos);
        var user = {
            id: uid,
            name: name,
            password: password,
            regtime: Date.now(),
            online: Date.now(),
            sessionid: createsid(uid)
        };
        if (hijk.db.insert('user', user)) {
            return user.sessionid;
        } else {
            return "exist 2";
        }
    };


    this.login = function(name, password, response) {
        var user = null;
        hijk.db.select("from user where name==?", name, function(u) {
            if (u.password === password) {
                user = u;
                return false;
            }
        });
        if (user) {
            user = user.clone();
            user.sessionid = createsid(user.id);
            user.online = Date.now();
            // save to database, use database to manage user-session-resources
            if (hijk.db.update('user', user)) {
                if (response) {
                    var ck = new Cookie(hijksid, user.sessionid);
                    ck.setMaxAge(60 * 60 * 24 * 365);
                    ck.setPath("/");
                    try {
                        response.addCookie(ck);
                    } catch (e) {
                        print(e.message);
                    }
                }
                return user.sessionid;
            } else {
                return "error";
            }
        } else {
            return "empty";
        }
    };

    this.getUserFromFullid = function(fullid) {
        var pos = fullid.indexOf("_");
        if (pos > 0) {
            var uid = fullid.substring(hijksid.length, pos);
            var user = hijk.db.selectKey('user', sys.int(uid));
            if (user && (user.sessionid === fullid)) {
                return user;
            }
        }
        return "Session TimeOut";
    };
    this.getUserFromUri = function(request) {
        var uri = request.getRequestURI().toString();
        uri = JType.LastFrom(uri, hijksid);
        if (uri.length > 0) {
            return  this.getUserFromFullid(uri);
        } else {
            return "use /api/method/hijksid**_****";
        }
    };

    this.getUserFromCookies = function(request) {
        var cs = request.getCookies();
        if (cs) {
            for (var i = 0; i < cs.length; i++) {
                var c = cs[i];
                if (c.name === hijksid) {
                    return this.getUserFromFullid(c.value);
                }
            }
        }
        return "No Cookie";
    };

    this.updateUserSession = function(user) {
        if (hijk.db.update('user', user)) {
            return user;
        } else {
            return "error";
        }
    };

    this.logout = function(user) {
        user = user.clone();
        user.sessionid = "";
        if (hijk.db.update('user', user)) {
            return "OK";
        } else {
            return "error";
        }
    };

}
userManager = new UserSessionClass();

hijk.api.user_register = function(map) {
    var name = map.name[0];
    var password = map.password[0];
    return userManager.register(name, password);
};

hijk.api.user_login = function(map, request, response) {
    var name = map.name[0];
    var password = map.password[0];
    return userManager.login(name, password, response);
};

// /api/user_helloworld/hijksid5_fdc5a8e9-69b6-4675-9602-6c63e7ba49df
// 'hijksid5_fdc5a8e9-69b6-4675-9602-6c63e7ba49df' from login
hijk.api.user_helloworld = function(map, request) {
    return 'Hello World! uri ' + userManager.getUserFromUri(request);
};

//  /api/user_helloworld_cookie
hijk.api.user_helloworld_cookie = function(map, request) {
    return 'Hello World! cookie ' + userManager.getUserFromCookies(request);
};

//  /api/user_session_values?key1=aaa&key2=bbb
hijk.api.user_session_values = function(map, request) {
    var user = userManager.getUserFromUri(request);
    if (!(user && user.sessionid)) {
        user = userManager.getUserFromCookies(request);
    }
    if (!(user && user.sessionid)) {
        return "No Session";
    }
    user = user.clone();
    var changed = false;
    for (var x in map) {
        if (hijk.table.user.data.hasOwnProperty(x)) {
            continue;
        }
        user[x] = map[x][0];
        changed = true;
    }
    if (changed) {
        return userManager.updateUserSession(user);
    } else {
        return user;
    }
};

hijk.api.user_logout = function(map, request) {
    var user = userManager.getUserFromUri(request);
    if (!(user && user.sessionid)) {
        user = userManager.getUserFromCookies(request);
    }
    if (!(user && user.sessionid)) {
        return "No Session";
    }
    return userManager.logout(user);
};