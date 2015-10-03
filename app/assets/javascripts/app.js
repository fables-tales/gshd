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
            console.log("signup was a success");
        }

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

        function displayIndex() {
            $("#index").show();
        }
        var oldHash = null;

        function updateStateFromHash(hash) {
            var hash = hash.slice(1, hash.length);
            var displayFunctions = {
                "": displayIndex
            }
        }

        function updateStateFromHashChange() {
            if (window.location.hash != oldHash) {
                updateStateFromHash(window.location.hash);
                oldHash = window.location.hash;
            }
        }

        setInterval(updateStateFromHashChange, 64);
    });
})();
