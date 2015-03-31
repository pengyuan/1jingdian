(function () {
    // Add csrf token header for Ajax request
    $.ajaxSetup({
        beforeSend: function (xhr, settings) {
            if (!/^(GET|HEAD|OPTIONS|TRACE)$/i.test(settings.type)) {
                xhr.setRequestHeader("X-CSRFToken", g.csrfToken);
            }
        }
    });

    // Find out params in routing rules
    var pattern = new RegExp("<[^:]*:?([^>]+)>", "g");
    var result = null;

    $.each(g.rules, function (endpoint, rules) {
        $.each(rules, function (index, rule) {
            rule.params = [];
            while ((result = pattern.exec(rule.rule)) !== null) {
                rule.params.push(result[1]);
            }
        });
    });

    /**
     * Generate url for the endpoint.
     * urlFor(endpoint [, values] [, external])
     * @param endpoint
     * @param values
     * @param external
     * @returns url for the endpoint.
     */
    function urlFor(endpoint, values, external) {
        var url = null,
            params = [],
            maxMatchDegree = 0.0,
            keys;

        if ($.type(values) === "boolean") {
            external = values
        }

        values = ($.type(values) !== 'undefined') ? values : {};
        external = ($.type(external) !== 'undefined') ? external : false;

        if (g.rules[endpoint] === undefined) {
            throw new Error("Uncorrect endpoint in " + "urlFor(\"" + endpoint + "\", " +
                JSON.stringify(values) + ")");
        }

        keys = $.map(values, function (value, key) {
            return key;
        });

        // Find the first matched rule among rules in this endpoint.
        $.each(g.rules[endpoint], function (index, rule) {
            var match = true,
                currentMatchDegree = 0.0;

            $.each(rule.params, function (index, param) {
                if ($.inArray(param, keys) === -1) {
                    match = false;
                    return false;
                }
            });

            if (match) {
                currentMatchDegree = parseFloat(rule.params.length) / keys.length;
                if (currentMatchDegree > maxMatchDegree || url === null) {
                    maxMatchDegree = currentMatchDegree;
                    url = rule.rule;
                    params = rule.params;
                }
            }
        });

        if (url) {
            $.each(keys, function (index, key) {
                // Built-in params
                if ($.inArray(key, params) > -1) {
                    url = url.replace(new RegExp("<[^:]*:?" + key + ">"), values[key]);
                } else {
                    // Query string params
                    if (url.indexOf("?") === -1) {
                        url += "?";
                    }
                    if (!endsWith(url, '?')) {
                        url += "&";
                    }
                    url += key + "=" + values[key];
                }
            });
        } else {
            throw new Error("Uncorrect parameters in " + "urlFor(\"" + endpoint + "\", " +
                JSON.stringify(values) + ")");
        }

        if (external) {
            url = g.domain + url
        }

        return url;
    }

    /**
     * Check whether str ends with suffix.
     * @param str
     * @param suffix
     * @returns {boolean}
     */
    function endsWith(str, suffix) {
        return str.indexOf(suffix, str.length - suffix.length) !== -1;
    }

    // Use $.fn.animate replace $.fn.transition when css3 transition not support.
    if (!$('html').hasClass('csstransitions')) {
        $.fn.transition = $.fn.animate;
    }

    window.urlFor = urlFor;
})();
