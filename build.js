
// PATH=JAVA8_HOME/bin
// jjs build.js
// run

print("Javascript WebAPI Development Package");
print("-----------------------");
print("HTTP Engine    : jetty http://www.eclipse.org/jetty/");
print("Database Engine: iBoxDB http://www.iboxdb.com");
print("Script Engine  : Nashorn JDK8");
print("-----------------------");
var hijk = {
    debug: true,
    title: "html iboxdb javascript kits",
    version: "0.1.0.1",
    server: {
        port: 8080,
        server: null
    },
    exception: null,
    dbexception: null,
    db: null,
    api: {},
    table: {}
};

function build_run() {
    var dirs = ["html", "iboxdb", "js", "kits"];
    for (var i = 0; i < dirs.l; i++) {
        var ff = new java.io.File(dirs[i]);
        ff.mkdir();
    }

    var ff = (new java.io.File("kits")).listFiles();
    var cp = "";
    for (var i = 0; i < ff.length; i++) {
        cp += (ff[i].getAbsolutePath() + ";");
    }
    cp = "jjs -cp " + cp + "  build.js";
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
    writefile("run.bat", cp);
    writefile("run.sh", "#!/usr/bin/env bash\r\n" + cp);
    print("use run.bat/sh");
}

try {
    var JType = {
        TypeLocal: Java.type("iBoxDB.LocalServer.Local"),
        TypeDB: Java.type("iBoxDB.LocalServer.DB"),
        TypeByteArray: Java.type("byte[]"),
        TypeRandomAccessFile: Java.type("java.io.RandomAccessFile"),
        TypeFile: Java.type("java.io.File"),
        TypeString: Java.type("java.lang.String"),
        UTF8: java.nio.charset.Charset.forName("UTF-8"),
        Random: new java.util.Random(),
        int: function(str) {
            return java.lang.Integer.valueOf(str);
        },
        long: function(str) {
            return java.lang.Long.valueOf(str);
        },
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
                return map;
            }
        },
        MapArray: function(array) {
            for (var i = 0; i < array.length; i++) {
                array[i] = JType.Map(array[i]);
            }
            return array;
        },
        AppTagField: Java.type("iBoxDB.LocalServer.Local").class.getField("AppTag"),
        AppTag: function(obj, value) {
            if (obj instanceof JType.TypeLocal) {
                if (value) {
                    JType.AppTagField.set(obj, value);
                    return value;
                } else {
                    return JType.AppTagField.get(obj);
                }
            } else {
                return null;
            }
        },
        JSONLocal: function(local) {
            if (local) {
                if ((typeof local === "string") || local instanceof String || local instanceof java.lang.String) {
                    return local;
                }
                var ch = JType.AppTag(local);
                if (ch) {
                    return ch;
                }
                if (local instanceof java.util.Map) {
                    var v = {};
                    for (var f in local) {
                        v[f] = local[f];
                    }
                    var json = JSON.stringify(v);
                    JType.AppTag(local, json);
                    return json;
                } else if (local instanceof java.lang.Iterable) {
                    var r = [];
                    local = local.iterator();
                    while (local.hasNext()) {
                        r.push(JType.JSONLocal(local.next()));
                    }
                    return "[" + r.join(",") + "]";
                } else if (local instanceof Array) {
                    var r = [];
                    for (var i = 0; i < local.length; i++) {
                        r.push(JType.JSONLocal(local[i]));
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
        }
    };
} catch (e) {
    build_run();
    exit();
}

if (JType) {
    function load_system() {

        function boxwrap(_box) {
            this.box = _box;
        }
        boxwrap.prototype = {
            insert: function(table, value) {
                value = JType.Map(value);
                return this.box.bind(table).insert(value);
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
            JType.TypeDB.root("iboxdb/");
            var db = new JType.TypeDB();


            for (var t in hijk.table) {
                var tableName = t;
                var data = hijk.table[tableName].data;
                var key = hijk.table[tableName].key;
                var index = hijk.table[tableName].index;
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
            hijk.db = load_database();
            hijk.exception = null;
            hijk.dbexception = "";
            print("Started " + new Date());
        } catch (e) {
            hijk.exception = e;
            print(toExceptionString(e));
        }
    }

    hijk.server.last_load = 0;
    var debug_load_system = (function() {
        var fileCache = {};
        return function() {
            if (hijk.debug && ((java.lang.System.currentTimeMillis() - hijk.server.last_load) > 5000)) {
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
                if (changed.length > 0) {
                    print("-----------------------");
                    print("Reload: " + changed);
                    load_system();
                    hijk.server.last_load = java.lang.System.currentTimeMillis();
                }
            }
        };
    })();

    var api_process_false = {};
    function api_process(request, response) {
        if (request.getRequestURI().startsWith("/edit/")) {
            var r = DebugEditor(request.getParameterMap(), request, response);
            return  JType.JSONLocal(r);
        } else if (request.getRequestURI().startsWith("/api/")) {
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
        } else {
            return api_process_false;
        }
    }

    function http_server_jetty() {
        JType.TypeServer = Java.type("org.eclipse.jetty.server.Server");
        JType.TypeResourceHandler = Java.type("org.eclipse.jetty.server.handler.ResourceHandler");
        JType.TypeHandler = Java.type("org.eclipse.jetty.server.Handler");
        var html = new JType.TypeResourceHandler();
        html.setDirectoriesListed(hijk.debug);
        html.setResourceBase("./html");
        html.setWelcomeFiles(["index.html"]);
        var api = new JType.TypeHandler(
                {
                    setServer: function(server) {
                        html.setServer(server);
                    },
                    getServer: function() {
                        return html.getServer();
                    },
                    isRunning: function() {
                        return true;
                    },
                    handle: function(target,
                            baseRequest,
                            request,
                            response) {
                        var r = api_process(request, response);
                        if (r !== api_process_false) {
                            response.setContentType("text/html;charset=utf-8");
                            response.setStatus(200);
                            response.getWriter().println(r);
                            baseRequest.setHandled(true);
                        } else {
                            html.handle(target, baseRequest,
                                    request,
                                    response);
                        }
                    }
                }
        );
        var server = new JType.TypeServer(hijk.server.port);
        server.setHandler(api);
        try {
            server.start();
        } catch (ex) {
            print(ex.message);
        }
        return server;
    }

    function run_script() {
        var count = 0;
        var script = "";
        print("jjs: (exit())");
        while (true) {
            var c = String.fromCharCode(java.lang.System.in.read());
            script += c;
            if (c === '(') {
                count++;
            }
            if (c === ')') {
                count--;
                if (count <= 0) {
                    var s = script;
                    script = "";
                    count = 0;
                    try {
                        eval(s);
                    } catch (e) {
                        print(e.message + " ");
                    }
                    print("jjs:");
                }
            }
        }
    }

    function toExceptionString(e) {
        return  hijk.dbexception + " " +
                e.message + " " +
                e.toString() + " " +
                e.fileName + " line:" +
                e.lineNumber + " column:" +
                e.columnNumber + "  " +
                e.stack + "  ";
    }

    var DebugEditor = function(map, request, response) {
        var fname = request.getRequestURI().replaceAll("/edit/", "");
        if (((!fname.startsWith("js/")) && (!fname.startsWith("html/"))) || (fname.contains(".."))) {
            return "Error Path , example edit/js/demo.js ,  edit/html/index.html ";
        }

        function read_file(path) {
            var file = new JType.TypeFile(path);
            if (!file.exists()) {
                var dirPath = path.substring(0, path.lastIndexOf("/"));
                (new JType.TypeFile(dirPath)).mkdirs();
            }
            if (file.isDirectory()) {
                return "";
            }
            var rf = new JType.TypeRandomAccessFile(file, "rw");
            try {
                if (rf.length() > 0) {
                    var bs = new JType.TypeByteArray(rf.length());
                    rf.read(bs);
                    return new JType.TypeString(bs, JType.UTF8);
                }
            } finally {
                rf.close();
            }
            return "";
        }
        function write_file(path, txt) {
            var file = new JType.TypeFile(path);
            if (file.isDirectory()) {
                return;
            }
            if (!txt) {
                txt = "";
            }
            file = new JType.TypeFile(path);
            rf = new JType.TypeRandomAccessFile(file, "rw");
            try {
                rf.setLength(0);
                rf.seek(0);
                rf.write(txt.getBytes(JType.UTF8));
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
            write_file(fname + ".bak", script);
            write_file(fname, map.js[0]);
            script = read_file(fname);
            msg = " saved " + JType.Date(new Date());
        }

        var html = "<html><body><form method='post' action='" + request.getRequestURI() +
                "'><textarea style='width: 100%; height: 90%' name='js'>" + script + "</textarea>" +
                "<button type='submit' value='save' name='save' >SAVE</button>" + msg +
                "</form></body></html>";
        return html;
    };
    if (hijk.debug) {
        debug_load_system();
    } else {
        DebugEditor = function() {
        };
        load_system();
    }
    hijk.server.server = http_server_jetty();
    run_script();
}