
// PATH=JAVA8_HOME/bin
// jjs build.js  or  jjs build.js -- http_port_8080 https_port_8081
// run

//Embedded 
//ScriptEngineManager factory = new ScriptEngineManager();
//ScriptEngine engine = factory.getEngineByName("nashorn");
//engine.eval("load('_DIR_/build.js')");
//Project Properties -> Run -> Working Directory = __DIR__
//print(__FILE__, __LINE__, __DIR__);


"use strict";
print("Javascript WebAPI Development Package");
print("-----------------------");
print("HTTP Engine    : jetty http://www.eclipse.org/jetty/");
print("Database Engine: iBoxDB http://www.iboxdb.com");
print("Script Engine  : Nashorn JDK8");
print("-----------------------");
var hijk = {
    debug: true,
    title: "html iboxdb javascript kits",
    version: "0.3.0.3",
    server: {
        port: 8080,
        sslport: 8081,
        keystore: 'keystore.jks',
        keypassword: 'localhost',
        threadCount: 512,
        server: null
    },
    //Max Cache  java.lang.Integer.MAX_VALUE
    dbCachePageCount: -1,
    //Thread Count
    dbReadStreamCount: -1,
    //file path
    dbaddress: 1,
    exception: null,
    dbexception: null,
    db: null,
    api: {},
    table: {}
};
if (arguments[0]) {
    hijk.server.port = parseInt(arguments[0]);
    if (arguments[1]) {
        hijk.server.sslport = parseInt(arguments[1]);
    } else {
        hijk.server.sslport = 0;
    }
}


hijk.dbaddress = hijk.server.port !== 0 ? hijk.server.port : hijk.server.sslport;
if (hijk.dbaddress === 0) {
    hijk.dbaddress = 1;
}


java.lang.Thread.currentThread().setContextClassLoader(
        new java.lang.ClassLoader({
            loadClass: function(str) {
                return Java.type(str).class;
            }
        }
        ));
function build_run() {
    var dirs = ["html", "iboxdb", "js", "kits"];
    for (var i = 0; i < dirs.l; i++) {
        var ff = new java.io.File(dirs[i]);
        ff.mkdir();
    }

    var ff = (new java.io.File("kits")).listFiles();
    var cp = "";
    for (var i = 0; i < ff.length; i++) {
        if (cp.length > 0) {
            cp += ";";
        }
        cp += ff[i].getAbsolutePath();
    }
    cp = "jjs -cp " + cp + "  build.js";
    cp += " -- " + hijk.server.port + " " + hijk.server.sslport;
    print(cp);
    print("-----------------------");
    function writefile(path, txt) {
        var ff = new java.io.File(path);
        ff.delete();
        var ra = new java.io.RandomAccessFile(ff, "rw");
        ra.seek(0);
        ra.writeBytes(txt);
        ra.close();
    }

    for each (var x in ["", hijk.dbaddress]) {
        writefile("run" + x + ".bat", cp);
        writefile("run" + x + ".sh", "#!/usr/bin/env bash\n" + cp.toString().replaceAll(";", ":"));
        try {
            java.lang.Runtime.getRuntime().exec("chmod +x run" + x + ".sh").waitFor();
        } catch (e) {
        }
    }

    print("use run.bat/sh");
}

try {

    var JType = {
        int: function(str) {
            return java.lang.Integer.valueOf(str);
        },
        long: function(str) {
            return java.lang.Long.valueOf(str);
        },
        map: function() {
            // m.put(name,value); m.get(name)
            return new java.util.concurrent.ConcurrentHashMap();
        },
        queue: function() {
            //q.add(v); v=q.poll(); 
            return new java.util.concurrent.ConcurrentLinkedQueue();
        },
        lock: (function() {
            var TypeBoxSystem = Java.type("iBoxDB.LocalServer.BoxSystem");
            return function(fun, o) {
                if (!o) {
                    o = null;
                }
                TypeBoxSystem.Lock(fun, o);
            };
        })(),
        thread: (function() {
            var pool = java.util
                    .concurrent.Executors.newFixedThreadPool(32);
            return function(fun) {
                pool.execute(fun);
            };
        })(),
        threadvar: function(value) {
            // tl.get(); tl.set(v);
            var t = new (Java.extend(java.lang.ThreadLocal, {
                initialValue: function() {
                    return value;
                }
            }))();
            return t;
        },
        threadreturn: function(thread_num) {
            //q.put(v); v=q.take()
            return new java.util.concurrent.ArrayBlockingQueue(thread_num);
        },
        sleep: function(millis) {
            if (millis < 0) {
                return java.lang.Thread.currentThread().getId();
            } else {
                java.lang.Thread.sleep(millis);
                return null;
            }
        },
        uuid: function() {
            return java.util.UUID.randomUUID().toString();
        },
        appid: (function() {
            var al = new java.util.concurrent.atomic.AtomicLong();
            return function() {
                return al.incrementAndGet();
            }
        })(),
        proxy: function(value) {
            var ap = new java.util.concurrent.atomic.AtomicReference(value);
            return {
                get: function() {
                    return ap.get();
                },
                set: function(v) {
                    ap.set(v);
                }
            };
        },
        http: new function() {
            var HttpClient = Java.type("org.eclipse.jetty.client.HttpClient");
            var SslContextFactory = Java.type("org.eclipse.jetty.util.ssl.SslContextFactory");
            var sslContextFactory = new SslContextFactory(true);
            var httpClient = new HttpClient(sslContextFactory);
            httpClient.start();
            this.get = function(uri) {
                var response = httpClient.newRequest(uri).send();
                return response.getContentAsString();
            };
            this.post = function(uri, params) {
                var client = httpClient.POST(uri);
                for (var x in params) {
                    client.param(x, params[x]);
                }
                var response = client.send();
                return  response.getContentAsString();
            };
        },
        socket: (function() {
            var WebSocketClient = Java.type("org.eclipse.jetty.websocket.client.WebSocketClient");
            var WebSocketListener = Java.type("org.eclipse.jetty.websocket.api.WebSocketListener");
            var SslContextFactory = Java.type("org.eclipse.jetty.util.ssl.SslContextFactory");
            var URI = Java.type("java.net.URI");
            var ClientUpgradeRequest = Java.type("org.eclipse.jetty.websocket.client.ClientUpgradeRequest");
            var sslContextFactory = new SslContextFactory(true);
            var client = new WebSocketClient(sslContextFactory);
            client.setMaxIdleTimeout(java.lang.Long.MAX_VALUE / 2);
            client.start();
            return function(uri) {
                var socket = new JType.JSocket();
                var request = new ClientUpgradeRequest();
                client.connect(
                        new WebSocketListener({
                            onWebSocketBinary: function(bytes, i, i1) {
                            },
                            onWebSocketError: function(cause) {
                            },
                            onWebSocketText: function(message) {
                                socket._callmessage(message);
                            },
                            onWebSocketClose: function(statusCode, reason) {
                                socket._callclose(reason);
                            },
                            onWebSocketConnect: function(sess) {
                                socket._callconnect(sess);
                            }
                        })
                        , new URI(uri), request).get();
                return socket;
            };
        })(),
        localhost: function() {
            try {
                var addrs = [];
                var faces = java.net.NetworkInterface.getNetworkInterfaces();
                while (faces.hasMoreElements()) {
                    var as = faces.nextElement().getInetAddresses();
                    while (as.hasMoreElements()) {
                        var e = as.nextElement();
                        //e.getHostName() + "/" +
                        addrs.push(e.getHostAddress());
                    }
                }
                return addrs.join("\n");
            } catch (e) {
                return e.message;
            }
        },
        //--------------------------------------------------------
        //-Internal-----------------------------------------------
        //--------------------------------------------------------
        TypeLocal: Java.type("iBoxDB.LocalServer.Local"),
        Random: new java.util.Random(),
        UTF8: java.nio.charset.Charset.forName("UTF-8"),
        Date: function(d) {
            if (d) {
                return new java.util.Date(d.getTime());
            } else {
                return new java.util.Date();
            }
        },
        Map: function(map) {
            if (map) {
                if (map instanceof java.util.Map) {
                    return map;
                }
                return new java.util.HashMap(map);
            } else {
                return this.map();
            }
        },
        MapArray: function(array) {
            for (var i = 0; i < array.length; i++) {
                array[i] = this.Map(array[i]);
            }
            return array;
        },
        AppTag: function(obj, value) {
            if (obj instanceof this.TypeLocal) {
                if (value) {
                    return obj.writeAppTag(value);
                } else {
                    return obj.readAppTag();
                }
            } else {
                return null;
            }
        },
        JSONLocal: function(local, force) {
            if (local) {
                if (!force) {
                    if ((typeof local === "string") || local instanceof String || local instanceof java.lang.String) {
                        return local;
                    }
                }
                var ch = this.AppTag(local);
                if (ch) {
                    return ch;
                }
                if (local instanceof java.util.Map) {
                    var v = {};
                    for (var f in local) {
                        v[f] = local[f];
                    }
                    var json = JSON.stringify(v);
                    this.AppTag(local, json);
                    return json;
                } else if (local instanceof java.lang.Iterable) {
                    var r = [];
                    local = local.iterator();
                    while (local.hasNext()) {
                        r.push(this.JSONLocal(local.next()));
                    }
                    return "[" + r.join(",") + "]";
                } else if (local instanceof Array) {
                    var r = [];
                    for (var i = 0; i < local.length; i++) {
                        r.push(this.JSONLocal(local[i], true));
                    }
                    return "[" + r.join(",") + "]";
                } else {
                    return JSON.stringify(local);
                }
            } else {
                return local;
            }
        },
        ForEach: function(src, fun) {
            if (src) {
                src = src.iterator();
                while (src.hasNext()) {
                    if (fun(src.next()) === false) {
                        break;
                    }
                }
            }
        },
        _Connection_count: new java.util.concurrent.atomic.AtomicInteger(),
        _JSocket_sessions: null,
        JSocket: function() {
            this.uid = JType.appid();
            this.session = null;
            this._onmessage = null;
            this.remoteid = "";
            this.msgbuffer = JType.queue();
            this._msg_state = null;
            this.onmessage = function(fun, state) {
                this._onmessage = fun;
                this._msg_state = state;
                this._flushmsg();
                return this;
            };
            this._onclose = null;
            this.onclose = function(fun) {
                this._onclose = fun;
                return this;
            };
            this.send = function(msg) {
                try {
                    this.session.getRemote()
                            .sendStringByFuture(JType.JSONLocal(msg));
                    return this;
                } catch (e) {
                    print(__LINE__, this.uid, toExceptionString(e));
                    return e;
                }
            };
            this.close = function() {
                try {
                    this.session.close();
                    return this;
                } catch (e) {
                    return e;
                }
            };
            this._callconnect = function(sess) {
                debug_load_system();
                JType._JSocket_sessions.put(this.uid, sess);
                this.session = sess;
                this.remoteid = sess.getRemoteAddress().toString();
            };
            this._callclose = function(reason) {
                JType._JSocket_sessions.remove(this.uid);
                if (this._onclose) {
                    this._onclose(reason);
                }
            };
            this._callmessage = function(msg) {
                debug_load_system();
                this.msgbuffer.add(msg);
                this._flushmsg();
            };
            this._flushmsg = function() {
                if (this._onmessage) {
                    var msg = this.msgbuffer.poll();
                    while (msg) {
                        var newonmessage = this._onmessage(msg, this._msg_state);
                        if (newonmessage) {
                            this._onmessage = newonmessage;
                        }
                        msg = this.msgbuffer.poll();
                    }
                }
            }
            ;
        }
    };
} catch (e) {
    build_run();
    exit();
}

if (JType) {
    var load_system = function(exjs) {
        function load_system_inner() {

            function boxwrap(_box) {
                this.box = _box;
            }
            boxwrap.prototype = {
                insert: function(table, value) {
                    value = JType.Map(value);
                    var r = this.box.bind(table).insert(value);
                    return r;
                },
                select: function(ql, params, fun) {
                    if (!(params instanceof Array)) {
                        params = [params];
                    }
                    var r = this.box.select(ql, params);
                    if (fun) {
                        JType.ForEach(r, fun);
                    }
                    return r;
                },
                selectCount: function(ql, params) {
                    if (!(params instanceof Array)) {
                        params = [params];
                    }
                    var r = this.box.selectCount(ql, params);
                    return r;
                },
                selectKey: function(table, key) {
                    if (!(key instanceof Array)) {
                        key = [key];
                    }
                    return this.box.bind(table, Java.to(key)).select();
                },
                update: function(table, value) {
                    value = JType.Map(value);
                    return this.box.bind(table, value).update(value);
                },
                delete: function(table, key) {
                    if (!(key instanceof Array)) {
                        key = [key];
                    }
                    return this.box.bind(table, Java.to(key)).delete();
                },
                id: function(pos) {
                    if (pos === undefined) {
                        pos = 0;
                    }
                    return JType.int(this.box.newId(pos, 1));
                }
            };
            function dbwrap(db) {
                this.close = function() {
                    db.getDatabase().close();
                };
                this.insert = function(table, value) {
                    if (!(value instanceof Array)) {
                        value = [value];
                    }
                    return db.insert(table, JType.MapArray(value));
                };
                this.select = function(ql, params, fun) {
                    if (!(params instanceof Array)) {
                        params = [params];
                    }
                    var r = db.select(ql, params);
                    if (fun) {
                        JType.ForEach(r, fun);
                    }
                    return r;
                };
                this.selectCount = function(ql, params) {
                    if (!(params instanceof Array)) {
                        params = [params];
                    }
                    var r = db.selectCount(ql, params);
                    return r;
                };
                this.selectKey = function(table, key) {
                    if (!(key instanceof Array)) {
                        key = [key];
                    }
                    return db.selectKey(table, Java.to(key));
                };
                this.update = function(table, value) {
                    if (!(value instanceof Array)) {
                        value = [value];
                    }
                    return db.update(table, JType.MapArray(value));
                };
                this.replace = function(table, value) {
                    if (!(value instanceof Array)) {
                        value = [value];
                    }
                    return db.replace(table, JType.MapArray(value));
                };
                this.delete = function(table, key) {
                    if (!(key instanceof Array)) {
                        key = [key];
                    }
                    return db.delete(table, Java.to(key));
                };
                this.id = function(pos) {
                    if (pos === undefined) {
                        pos = 0;
                    }
                    return db.id(pos);
                };
                this.cube = function(transaction) {
                    var box = db.cube();
                    try {
                        var wbox = new boxwrap(box);
                        if (transaction(wbox)) {
                            return box.commit().toString();
                        }
                    } finally {
                        box.close();
                    }
                };
            }


            function load_database() {
                var TypeDB = Java.type("iBoxDB.LocalServer.DB");
                TypeDB.root("iboxdb/");
                var db = new TypeDB(hijk.dbaddress);

                var config = db.getConfig().Config;
                if (hijk.dbCachePageCount > 0) {
                    var ccfield = config.getClass().getField('CachePageCount');
                    ccfield.set(config, JType.int(hijk.dbCachePageCount));
                }

                if (hijk.dbReadStreamCount > 0) {
                    var ccfield = config.getClass().getField('ReadStreamCount');
                    ccfield.set(config, java.lang.Byte.valueOf(hijk.dbReadStreamCount));
                }

                for (var tableName in hijk.table) {
                    var data = hijk.table[tableName].data;
                    var key = hijk.table[tableName].key;
                    var index = hijk.table[tableName].index;
                    if (!data) {
                        print('use default table setting, ' + tableName);
                        data = {id: 0};
                        key = ["id"];
                    }
                    if (!key) {
                        key = ["id"];
                    }
                    try {
                        db.getConfig().ensureTable(tableName, JType.Map(data), key);
                        if (index) {
                            for (var i = 0; i < index.length; i++) {
                                db.getConfig().ensureIndex(tableName, JType.Map(data), index[i]);
                            }
                        }
                    } catch (e) {
                        hijk.dbexception = "database setting error: [" + tableName + "]";
                        throw e;
                    }
                }


                try {
                    db = db.open();
                    if (!db) {
                        print("previous db setting");
                        db = db.open();
                    }
                } catch (e) {
                    print(e.message);
                    db = db.open();
                }
                return new dbwrap(db);
            }

            if (hijk.db) {
                hijk.db.close();
            }
            hijk.db = null;
            hijk.api = {};
            hijk.table = {};
            if (JType._JSocket_sessions) {
                redo: for (var x in JType._JSocket_sessions) {
                    var y = JType._JSocket_sessions[x];
                    if (y) {
                        y.close();
                    } else {
                        break redo;
                    }
                }
            }
            JType._JSocket_sessions = JType.map();
            try {
                var ff = (new java.io.File("js")).listFiles();
                var paths = [];
                for (var i = 0; i < ff.length; i++) {
                    var path = ff[i].getAbsolutePath();
                    if (path.endsWith(".js")) {
                        paths.push(path);
                    }
                }
                paths.sort();
                for (var i = 0; i < paths.length; i++) {
                    load(paths[i]);
                }

                if (typeof exjs === "string") {
                    load(exjs);
                } else if (typeof exjs === "function") {
                    exjs();
                }

                hijk.db = load_database();
                hijk.exception = null;
                hijk.dbexception = "";
                print("Started " + new Date());
            } catch (e) {
                hijk.exception = e;
                print(toExceptionString(e));
            }
        }

        JType.lock(load_system_inner);
    };

    hijk.server.last_load = 0;
    var debug_load_system = (function() {
        var fileCache = {};
        return function() {
            if ((java.lang.System.currentTimeMillis() - hijk.server.last_load) > 5000) {
                var changed = "";
                var ff = (new java.io.File("js")).listFiles();
                for (var i = 0; i < ff.length; i++) {
                    var path = ff[i].getAbsolutePath();
                    if (path.endsWith(".js")) {
                        var ll = ff[i].lastModified();
                        if ((!fileCache[path]) || (fileCache[path] !== ll)) {
                            changed += (path + "; ");
                        }
                        fileCache[path] = ll;
                    }
                }
                if (changed.toString().length() > 0) {
                    print("-----------------------");
                    print("Reload: " + changed);
                    load_system();
                    hijk.server.last_load = java.lang.System.currentTimeMillis();
                }
            }
        };
    })();
    var api_process = function(request, response) {
        debug_load_system();
        if (hijk.exception) {
            return toExceptionString(hijk.exception);
        } else {
            hijk.server.last_load = java.lang.System.currentTimeMillis();
            var ks = request.getRequestURI().split("/");
            var fun = hijk.api[ks[2]];
            if (fun) {
                try {
                    var r = fun(request.getParameterMap(), request, response);
                    return JType.JSONLocal(r);
                } catch (e) {
                    return toExceptionString(e);
                }
            } else {
                return JType.JSONLocal({MSG: 'NotAPI'});
            }
        }
    };
    JType.WebSocketListener = Java.type("org.eclipse.jetty.websocket.api.WebSocketListener");
    var ws_api_process = function(req, resp) {

        var socket = new JType.JSocket();
        return new JType.WebSocketListener({
            onWebSocketBinary: function(bytes, i, i1) {
            },
            onWebSocketError: function(cause) {
            },
            onWebSocketText: function(message) {
                socket._callmessage(message);
            },
            onWebSocketClose: function(statusCode, reason) {
                socket._callclose(reason);
            },
            onWebSocketConnect: function(sess) {
                socket._callconnect(sess);
                socket.map = req.getHttpServletRequest().getParameterMap();
                var ks = req.getHttpServletRequest().getRequestURI().toString().split("/");
                this.callfun(ks[2], socket);
            },
            callfun: function(api, socket) {
                if (hijk.exception) {
                    socket.send(toExceptionString(hijk.exception));
                    socket.close();
                } else {
                    hijk.server.last_load = java.lang.System.currentTimeMillis();
                    var fun = hijk.api[ api ];
                    if (fun) {
                        try {
                            fun(socket, req, resp);
                        } catch (e) {
                            var msg = toExceptionString(e);
                            socket.send(msg);
                            socket.close();
                        }
                    } else {
                        socket.send(JType.JSONLocal({MSG: 'NotAPI'}));
                        socket.close();
                    }
                }

            }
        });
    };
    var http_server_jetty = function() {
        var Server = Java.type("org.eclipse.jetty.server.Server");
        var ResourceHandler = Java.type("org.eclipse.jetty.server.handler.ResourceHandler");
        var Handler = Java.type("org.eclipse.jetty.server.Handler");
        var ServerConnector = Java.type("org.eclipse.jetty.server.ServerConnector");
        var HttpConfiguration = Java.type("org.eclipse.jetty.server.HttpConfiguration");
        var SecureRequestCustomizer = Java.type("org.eclipse.jetty.server.SecureRequestCustomizer");
        var SslContextFactory = Java.type("org.eclipse.jetty.util.ssl.SslContextFactory");
        var SslConnectionFactory = Java.type("org.eclipse.jetty.server.SslConnectionFactory");
        var HttpConnectionFactory = Java.type("org.eclipse.jetty.server.HttpConnectionFactory");
        var QueuedThreadPool = Java.type("org.eclipse.jetty.util.thread.QueuedThreadPool");
        var WebSocketServlet = Java.type("org.eclipse.jetty.websocket.servlet.WebSocketServlet");
        var ServletContextHandler = Java.type("org.eclipse.jetty.servlet.ServletContextHandler");
        var ServletHolder = Java.type("org.eclipse.jetty.servlet.ServletHolder");
        var WebSocketCreator = Java.type("org.eclipse.jetty.websocket.servlet.WebSocketCreator");
        var WebSocketHandler = Java.type("org.eclipse.jetty.websocket.server.WebSocketHandler");
        var HttpServlet = Java.type("javax.servlet.http.HttpServlet");
        var File = Java.type("java.io.File");

        var html = new ResourceHandler();
        html.setDirectoriesListed(hijk.debug);
        html.setResourceBase("./html");
        html.setWelcomeFiles(["index.html"]);
        var ws = new WebSocketServlet({
            configure: function(factory) {
                factory.getPolicy().setIdleTimeout(java.lang.Long.MAX_VALUE / 2);
                factory.setCreator(
                        new WebSocketCreator({
                            createWebSocket: function(req, resp) {
                                return ws_api_process(req, resp);
                            }
                        }));
            }});
        var parseRequest = (function() {
            var DiskFileItemFactory = Java.type("org.apache.commons.fileupload.disk.DiskFileItemFactory");
            var ServletFileUpload = Java.type("org.apache.commons.fileupload.servlet.ServletFileUpload");
            var ud = new File("html/uploads/");
            ud.mkdir();
            var of = new File("html/uploads/temp/");
            of.mkdir();
            var lf = of.listFiles();
            for (var i = 0; i < lf.length; i++) {
                lf[i].delete();
            }

            var factory = new DiskFileItemFactory();
            factory.setSizeThreshold(4096);
            factory.setRepository(of);

            var upload = new ServletFileUpload(factory);
            upload.setSizeMax(1024 * 1024 * 1);
            return function(req) {
                return upload.parseRequest(req);
            };
        })();
        var upload = new HttpServlet({
            doPrint: function(outp, msg) {
                var txt = "<html><body><h3>FileUpload</h3>\n\
 <form action='/api/ws_upload' method='post' enctype='multipart/form-data'>\n\
<input type='file' name='userfile1' />\n\
<input type='submit' value='Submit' /><input type='reset' value='Reset' /></form><div id='msg'>";
                txt += (msg + "</div></body></html>");
                outp.print(txt);
            },
            doGet: function(req, resp) {
                var outp = resp.getWriter();
                this.doPrint(outp, "");
            },
            doPost: function(req, resp) {
                var saves = [];
                var fileItems = parseRequest(req);
                var i = fileItems.iterator();
                while (i.hasNext()) {
                    var fi = i.next();
                    var fname = fi.getName();
                    if (fname.length() < 1) {
                        continue;
                    }
                    fname = fname.substring(fname.lastIndexOf("."));
                    fname = JType.uuid() + fname;
                    fi.write(new File("html/uploads/" + fname));
                    var path = "<a href='/uploads/" + fname + "' >online:" + fi.getName() + "</a>";
                    saves.push(path);
                }
                var outp = resp.getWriter();
                this.doPrint(outp, saves.join(";"));
            }
        });
        var servlet = new ServletContextHandler(
                ServletContextHandler.NO_SESSIONS
                );
        servlet.setContextPath("/");

        servlet.addServlet(new ServletHolder(upload), "/api/ws_upload");
        servlet.addServlet(new ServletHolder(ws), "/api/*");


        var conn_count = JType._Connection_count;
        var api = new Handler(
                {
                    setServer: function(server) {
                        html.setServer(server);
                        servlet.setServer(server);
                    },
                    getServer: function() {
                        return servlet.getServer();
                    },
                    isRunning: function() {
                        return servlet.isRunning();
                    },
                    start: function() {
                        html.start();
                        servlet.start();
                    },
                    handle: function(target,
                            baseRequest,
                            request,
                            response
                            ) {
                        conn_count.incrementAndGet();
                        try {
                            var r = null;
                            if (request.getRequestURI().startsWith("/edit/")) {
                                r = DebugEditor(request.getParameterMap(), request, response);
                                r = JType.JSONLocal(r);
                            } else if (request.getRequestURI().startsWith("/api/ws_")) {
                                // WebSocket 
                                servlet.handle(target, baseRequest,
                                        request,
                                        response);
                            } else if (request.getRequestURI().startsWith("/api/")) {
                                //Http Https
                                r = api_process(request, response);
                            }
                            if (baseRequest.isHandled()) {
                            } else if (r !== null) {
                                baseRequest.setHandled(true);
                                response.setContentType("text/html;charset=utf-8");
                                response.setStatus(200);
                                response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
                                response.setHeader("Pragma", "no-cache");
                                response.setDateHeader("Expires", 0);
                                response.getWriter().println(r);
                            } else {
                                html.handle(target, baseRequest,
                                        request,
                                        response);
                            }
                        } finally {
                            conn_count.decrementAndGet();
                        }
                    }}
        );
        var threadPool = new QueuedThreadPool(hijk.server.threadCount);
        var server = new Server(threadPool);
        if (hijk.server.port !== 0) {
            var connector = new ServerConnector(server);
            connector.setPort(Math.abs(hijk.server.port));
            server.addConnector(connector);
        }

        if (hijk.server.sslport !== 0) {
            var https = new HttpConfiguration();
            https.addCustomizer(new SecureRequestCustomizer());
            //SSL: keytool -genkey -alias server -keyalg RSA -keysize 1024 -keystore keystore.jks
            var sslContextFactory = new SslContextFactory();
            sslContextFactory.setKeyStorePath(hijk.server.keystore);
            sslContextFactory.setKeyStorePassword(hijk.server.keypassword);
            var sslConnector = new ServerConnector(server,
                    [new SslConnectionFactory(sslContextFactory, "http/1.1"),
                        new HttpConnectionFactory(https)]);
            sslConnector.setPort(Math.abs(hijk.server.sslport));
            server.addConnector(sslConnector);
        }

        server.setHandler(api);
        try {
            server.start();
        } catch (ex) {
            print(ex.message);
            exit();
        }
        return server;
    }
    ;
    var run_script = function() {
        var global = {};
        var count = 0;
        var script = JType.proxy("");
        function dbprint(ql, args) {
            JType.thread(function() {
                try {
                    var vs = [];
                    var c = 0;
                    var dt = java.lang.System.currentTimeMillis();
                    hijk.db.cube(function(box) {
                        box.select(ql, args, function(v) {
                            vs.push(JType.JSONLocal(v));
                            if (((++c) % 10000) === 9999) {
                                print("loading " + c);
                            }
                        });
                    });
                    dt = (java.lang.System.currentTimeMillis() - dt) / 1000.0;
                    for (var i = 0; i < vs.length; i++) {
                        if (script.get().length > 2) {
                            script.set("");
                            count = 0;
                            break;
                        }
                        print(vs[i]);
                    }
                    print("Count: " + vs.length + ",  Time: " + dt);
                } catch (e)
                {
                    print("[" + e.message + "]");
                }
            });
        }
        function online() {
            print("Connections:", JType._Connection_count.get() + JType._JSocket_sessions.size());
            var rt = java.lang.Runtime.getRuntime();
            print("maxMemory:  ", rt.maxMemory(), "run.bat/sh -> jjs -J-Xmx4g -cp ... build.js");
            print("totalMemory:", rt.totalMemory());
            print("freeMemory: ", rt.freeMemory());
            print(java.lang.System.getProperty('os.name'),
                    java.lang.System.getProperty('java.vm.name'),
                    java.lang.System.getProperty('java.runtime.version'));
        }


        var tables = ["TableNames:"];
        hijk.db.cube(function(tran) {
            var schemas = tran.box.GetSchemas();
            for (var name in schemas) {
                tables.push(name);
            }
        }
        );

        function help() {
            print("");
            print(tables.join(' '));
            print("dbprint( 'from table1' )");
            print("dbprint( 'from table1 where id < ? order by id limit 0 , 20' , [ 100 ] )");
            print("online(); jsload('/tmp/my.js'); exit(); print(...); ( ...;...;...; ); help()");
            print(":");
        }
        help();

        while (true) {
            var c = String.fromCharCode(java.lang.System.in.read());
            script.set(script.get() + c);
            if (c === '(') {
                count++;
            }
            if (c === ')') {
                count--;
                if (count <= 0) {
                    try {
                        var s = script.get().toString().trim();
                        if (s[0] === '(') {
                            s = s.substr(1, s.length - 2);
                        }
                        s = "(function(){ " +
                                s + " })()";
                        script.set("");
                        count = 0;

                        eval(s);
                    } catch (e) {
                        print("[" + e.message + "]");
                    }
                    print(":");
                }
            }
        }
    };
    var toExceptionString = function(e) {
        return  hijk.dbexception + " " +
                e.message + " " +
                e.toString() + " " +
                e.fileName + " line:" +
                e.lineNumber + " column:" +
                e.columnNumber + "  " +
                e.stack + "  ";
    };
    var DebugEditor = function(map, request, response) {
        var fname = request.getRequestURI().replaceAll("/edit/", "");
        if (((!fname.startsWith("js/")) && (!fname.startsWith("html/"))) || (fname.contains(".."))) {
            return "Error Path , example edit/js/demo.js ,  edit/html/index.html ";
        }
        var TypeRandomAccessFile = Java.type("java.io.RandomAccessFile");
        var TypeBytes = Java.type("byte[]");
        var TypeFile = Java.type("java.io.File");
        var TypeString = Java.type("java.lang.String");
        function read_file(path) {
            var file = new TypeFile(path);
            if (!file.exists()) {
                var dirPath = path.substring(0, path.lastIndexOf("/"));
                (new TypeFile(dirPath)).mkdirs();
            }
            if (file.isDirectory()) {
                return "";
            }
            var rf = new TypeRandomAccessFile(file, "rw");
            try {
                if (rf.length() > 0) {
                    var bs = new TypeBytes(rf.length());
                    rf.read(bs);
                    return new TypeString(bs, JType.UTF8);
                }
            } finally {
                rf.close();
            }
            return "";
        }

        function write_file(path, txt, append) {
            var file = new TypeFile(path);
            if (file.isDirectory()) {
                return;
            }
            if (!txt) {
                txt = "";
            }
            file = new TypeFile(path);
            var rf = new TypeRandomAccessFile(file, "rw");
            try {
                if (append) {
                    rf.seek(rf.length());
                    txt = "\r\n//----" + (new Date()) + "----\r\n" + txt;
                } else {
                    rf.setLength(0);
                    rf.seek(0);
                }
                rf.write(txt.toString().getBytes(JType.UTF8));
            } finally {
                rf.close();
            }
        }

        var msg = "";
        var script = read_file(fname);
        if (script === "") {
            if (fname.endsWith(".html")) {
                script = "<html><body></body></html>";
            } else {
                script = "hijk.api.helloworld = function(map, request, response){ return \"Edit Hello World\" };";
            }
        }

        if (map.js) {
            write_file(fname + ".bak", script, true);
            write_file(fname, map.js[0], false);
            script = read_file(fname);
            msg = " saved " + JType.Date(new Date());
        }

        var html = "<html><body><form method='post' action='" + request.getRequestURI() +
                "'><textarea style='width: 100%; height: 90%' name='js'>" + script + "</textarea>" +
                "<button type='submit' value='save' name='save' >SAVE</button>" + msg +
                "</form></body></html>";
        return html;
    };

    try {
        var sys = JType;
        var jsload = load_system;

        if (hijk.debug) {
            debug_load_system();
        } else {
            DebugEditor = function() {
            };
            debug_load_system = function() {
            };
            load_system();
        }
        hijk.server.server = http_server_jetty();
        run_script();
    } catch (e) {
        print(toExceptionString(e));
    }
}