(function() {
    $(document).ready(function() {
        displayIndex();
        function setGravatarHash(hash) {
            $(".data-gravatar-img").attr("src", "https://www.gravatar.com/avatar/" + hash);
        }

        function signupFailed() {
            $("#signup-errors").text("We couldn't sign you up! Please try again").show();
        }

        function signupSuccess() {
            window.location.hash = "dashboard";
            $(".data-user-image").attr("src", "/user-image?" + new Date().getTime());
        }

        $("#login-form").submit(function(e) {
            var payload = {
                email: $("#login-email").val(),
                password: $("#login-password").val(),
            }
            console.log("payload");
            $.ajax({
                url: '/login',
                type: 'POST',
                beforeSend: function(xhr) { xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content')) },
                data: payload,
                success: signupSuccess
            }).error(signupFailed);
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        $("#signup-form").submit(function(e) {
            console.log("sign up form handler");
            var payload = {
                name: $("#signup-name").val(),
                email: $("#signup-email").val(),
                password: $("#signup-password").val(),
            }
            console.log("payload");
            $.ajax({
                url: '/signup',
                type: 'POST',
                beforeSend: function(xhr) { xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content')) },
                data: payload,
                success: signupSuccess
            }).error(signupFailed);
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        setGravatarHash($("#signup-email").val());

        $("#signup-email").change(function() {
            var email = $("#signup-email").val();
            var normalizedEmail = email.trim().toLowerCase();
            var gravatarHash = md5(normalizedEmail);
            setGravatarHash(gravatarHash);
            $("#profile-picture-help").show();
        });

        function hideAllPages() {
            $(".page").hide();
        }

        function displayIndex() {
            hideAllPages();
            $("#index").show();
        }

        function displayDashboard() {
            hideAllPages();
            $("#dashboard").show();
            loadDashboardContent();
        }

        function showRecs() {
            $.getJSON("/recommendations", function(response) {
                $("#dashboard-spinner").hide();
                $("#dashboard-terms").hide();
                $("#dashboard-recs").html("<h1>Why not contact these wonderful people?</h1>" + JSON.stringify(response.recommendations));
                $("#dashboard-recs").show();
            });
        }

        function loadDashboardContent() {
            $.getJSON("/terms", function(response) {
                if (response) {
                    showRecs();
                } else {
                    $.get("/term_bookmarklet.js", function(response) {
                        $("#bookmarklet").val("javascript:" + response.replace("\n", ""));
                        $("#dashboard-spinner").hide();
                        $("#dashboard-terms").show();
                        console.log("here");
                        var to = setInterval(function() {
                            console.log("in timeout");
                            $.getJSON("/terms", function(response) {
                                if (response) {
                                    clearTimeout(to);
                                    showRecs();
                                }
                            });
                        }, 1000);
                    });
                }
            });
        }

        var oldHash = null;

        function updateStateFromHash(hash) {
            var hash = hash.slice(1, hash.length);
            console.log("new hash is: " + hash);
            var displayFunctions = {
                "": displayIndex,
                "dashboard": displayDashboard
            }[hash]();
        }

        function updateStateFromHashChange() {
            if (window.location.hash != oldHash) {
                console.log("hash changed")
                updateStateFromHash(window.location.hash);
                oldHash = window.location.hash;
            }
        }

        setInterval(updateStateFromHashChange, 64);
    });
})();
