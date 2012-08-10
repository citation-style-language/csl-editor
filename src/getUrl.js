// a requirejs plugin that just returns a URL using the correct baseUrl

define({
    load: function (name, req, load, config) {
        load(req.toUrl(name));
    }
});

