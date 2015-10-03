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

        function displayMessages() {
            hideAllPages();
            $("#messages").show();
            setupMessageCircuit(JSON.parse(window.location.hash.split("?")[1]))
        }

        var chattingUser = null;
        var channel = null;

        function addChatMessage(date, name, message) {
            $("#chat").append("<p>&lt;" + (date.toISOString()) + "&gt;" + name + ": " + message + "</p>");
        }

        function sendToChatEndpoint(message, user_id) {
            var payload = {
                other_user_id: user_id,
                message: message
            }
            $.ajax({
                url: '/chat',
                type: 'POST',
                beforeSend: function(xhr) { xhr.setRequestHeader('X-CSRF-Token', $('meta[name="csrf-token"]').attr('content')) },
                data: payload,
                success: function() { addChatMessage(new Date(), "You", message) }
            }).error(function(e) { console.log("error sending chat message") });
        }

        $("#message-send-form").submit(function(e) {
            sendToChatEndpoint($("#message-send-chat").val(), chattingUser);
            $("#message-send-chat").val("");
            e.preventDefault();
            e.stopPropagation();
            return false;
        });

        function renderChatHistory(messages) {
            for (var i = 0; i < messages.length; i++) {
                var message = messages[i];
                message["at"] = new Date(message["at"]*1000);
                addChatMessage(message.at, message.name, message.message);
            }
            $("#chat").append("<hr>");
        }

        function setupMessageCircuit(params) {
            $.getJSON("/current_user_id", function(response) {
                chattingUser = params.id;
                var currentUserID = response.id;
                $.get("/chat_history/" + params.id, function(response) {
                    renderChatHistory(response.chat_history);
                    channel = pusher.subscribe("messages_from_" + chattingUser + "_to_" + currentUserID);
                    channel.bind("message", function(data) {
                        addChatMessage(new Date(data.at*1000), data.name, data.message);
                    });
                    $.getJSON("/users/" + params.id, function(response) {
                        $("#chat-header").html("Chatting with " + response.name + "<img src='https://gravatar.com/avatar/" + md5(response.email) + "' style='height:1em;' class='pull-right'>");
                        $("#chat-wrapper").show();

                    });
                });
            });
        }

        function renderProfile(rec) {
            return "<div class='col-md-2 text-center'><img src='https://gravatar.com/avatar/" + md5(rec.email) + "'><br>" + rec.name + "<br><a href='#message?" + JSON.stringify({"id": rec.id}) + "' class='btn btn-bx'>Say hi!</a></div>";
        }

        function renderProfiles(recs) {
            build = "<div class='col-md-2'></div>";
            for (var i = 0; i < recs.length; i++) {
                build += "\n";
                build += renderProfile(recs[i]);
            }
            return build;
        }

        function showRecs() {
            $.getJSON("/recommendations", function(response) {
                $("#dashboard-spinner").hide();
                $("#dashboard-terms").hide();
                $("#dashboard-recs").html("<h1>Why not contact these wonderful people?</h1>" + renderProfiles(response.recommendations));
                $("#dashboard-recs").show();
            });
        }

        function loadDashboardContent() {
            $.getJSON("/terms", function(response) {
                if (response.length > 0) {
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
                                if (response.length > 0) {
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
            if (channel) {
                console.log("unbound channel");
                channel.unbind();
                $("#chat").empty();
            }
            var hash = hash.slice(1, hash.length);
            console.log("new hash is: " + hash);
            var displayFunctions = {
                "": displayIndex,
                "dashboard": displayDashboard,
                "message": displayMessages
            }[hash.split("?")[0]]();
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
