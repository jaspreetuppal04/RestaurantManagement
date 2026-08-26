/* ADD FOOD ITEM TO ORDER*/

function addOrder(foodName) {

    const orderList =
        document.getElementById("orderList");


    /* Create new list item */

    const listItem =
        document.createElement("li");


    /* Food name */

    const foodText =
        document.createElement("span");

    foodText.textContent =
        foodName;


    /* Create Remove button */

    const removeButton =
        document.createElement("button");

    removeButton.textContent =
        "Remove";


    /* Remove order */

    removeButton.onclick = function () {

        listItem.remove();

    };


    /* Add food name and button */

    listItem.appendChild(foodText);

    listItem.appendChild(removeButton);


    /* Add item to order list */

    orderList.appendChild(listItem);

}



/* PRACTICAL-4: DRAG AND DROP API */


/* Allow dropping */

function allowDrop(event) {

    event.preventDefault();

}


/* Start dragging */

function drag(event) {

    const foodItem =
        event.currentTarget;


    const foodName =
        foodItem.querySelector("h3").textContent;


    event.dataTransfer.setData(
        "text/plain",
        foodName
    );

}


/* Drop food item */

function drop(event) {

    event.preventDefault();


    const foodName =
        event.dataTransfer.getData("text/plain");


    if (foodName) {

        addOrder(foodName);

    }

}



/* Practical 4: GEOLOCATION API */

function getLocation() {

    const locationResult =
        document.getElementById("locationResult");


    /* Check browser support */

    if (!navigator.geolocation) {

        locationResult.textContent =
            "Geolocation is not supported by your browser.";

        return;

    }


    locationResult.textContent =
        "Getting your location...";


    navigator.geolocation.getCurrentPosition(

        function (position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;


            locationResult.innerHTML =
                "Latitude: " +
                latitude +
                "<br>Longitude: " +
                longitude;

        },

        function () {

            locationResult.textContent =
                "Unable to get your location.";

        }

    );

}



/* =====================================================
   SIGN UP
   ===================================================== */

const signupForm =
    document.getElementById("signupForm");


if (signupForm) {

    signupForm.addEventListener(
        "submit",
        function (event) {

            /* Prevent page refresh */

            event.preventDefault();


            /* Get form values */

            const firstName =
                document
                    .getElementById("firstName")
                    .value
                    .trim();


            const mobile =
                document
                    .getElementById("mobile")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("email")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("signupPassword")
                    .value;


            const address =
                document
                    .getElementById("address")
                    .value
                    .trim();


            /* Check empty fields */

            if (
                firstName === "" ||
                mobile === "" ||
                email === "" ||
                password === "" ||
                address === ""
            ) {

                alert(
                    "Please fill in all the fields."
                );

                return;

            }


            /* Password validation */

            if (password.length < 6) {

                alert(
                    "Password must contain at least 6 characters."
                );

                return;

            }


            /* PRACTICAL-4: LOCAL STORAGE */

            /* Get existing user */

            const savedUser =
                localStorage.getItem("fatTurtleUser");


            if (savedUser) {

                const existingUser =
                    JSON.parse(savedUser);


                /* Check duplicate email */

                if (
                    existingUser.email.toLowerCase() ===
                    email.toLowerCase()
                ) {

                    alert(
                        "An account with this email already exists. Please login."
                    );

                    return;

                }

            }


            /* Create user */

            const user = {

                firstName: firstName,

                mobile: mobile,

                email: email,

                password: password,

                address: address

            };


            /* Save user */

            localStorage.setItem(
                "fatTurtleUser",
                JSON.stringify(user)
            );


            /* Make sure user is logged out */

            localStorage.removeItem(
                "fatTurtleLoggedIn"
            );


            /* Success */

            alert(
                "Sign Up successful! You can now login."
            );


            /* Clear form */

            signupForm.reset();


            /* PRACTICAL-5: BOOTSTRAP 5 MODAL */

            const signupModalElement =
                document.getElementById("signupModal");


            if (signupModalElement) {

                const signupModal =
                    bootstrap.Modal.getInstance(
                        signupModalElement
                    );


                if (signupModal) {

                    signupModal.hide();

                }

            }

        }
    );

}



/* LOGIN */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        function (event) {

            /* Prevent page refresh */

            event.preventDefault();


            /* Get login details */

            const email =
                document
                    .getElementById("loginEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("loginPassword")
                    .value;


            /* Get saved account */

            const savedUser =
                localStorage.getItem("fatTurtleUser");


            /* No account */

            if (!savedUser) {

                alert(
                    "No account found. Please Sign Up first."
                );

                return;

            }


            /* Convert saved data to object */

            const user =
                JSON.parse(savedUser);


            /* Check email AND password */

            if (
                email.toLowerCase() ===
                user.email.toLowerCase()
                &&
                password ===
                user.password
            ) {

                /* Login successful */

                localStorage.setItem(
                    "fatTurtleLoggedIn",
                    "true"
                );


                /* Clear login form */

                loginForm.reset();


                /* Close login modal */

                const loginModalElement =
                    document.getElementById("loginModal");


                if (loginModalElement) {

                    const loginModal =
                        bootstrap.Modal.getInstance(
                            loginModalElement
                        );


                    if (loginModal) {

                        loginModal.hide();

                    }

                }


                /* Update header */

                showLoggedInUser();


                /* Success message */

                alert(
                    "Login successful!"
                );

            }

            else {

                /* Wrong credentials */

                alert(
                    "Invalid email or password."
                );

            }

        }
    );

}



/* LOGOUT */

function logoutUser() {

    /* Remove only login status */

    localStorage.removeItem(
        "fatTurtleLoggedIn"
    );


    /* Update header */

    showLoggedInUser();


    /* Message */

    alert(
        "You have been logged out successfully."
    );

}



/* DISPLAY LOGGED-IN USER */

function showLoggedInUser() {

    /* Get saved account */

    const savedUser =
        localStorage.getItem("fatTurtleUser");


    /* Get login status */

    const loggedIn =
        localStorage.getItem("fatTurtleLoggedIn");


    /* Get header elements */

    const authButtons =
        document.getElementById("authButtons");


    const userAccount =
        document.getElementById("userAccount");


    const welcome =
        document.getElementById("userWelcome");


    /* USER IS LOGGED IN */

    if (
        savedUser &&
        loggedIn === "true"
    ) {

        const user =
            JSON.parse(savedUser);


        /* Hide Login / Sign Up */

        if (authButtons) {

            authButtons.style.display =
                "none";

        }


        /* Show user account */

        if (userAccount) {

            userAccount.style.display =
                "flex";

        }


        /* Show user's name */

        if (welcome) {

            welcome.textContent =
                "Welcome, " +
                user.firstName;

        }

    }


    /* USER IS LOGGED OUT */

    else {

        /* Show Login / Sign Up */

        if (authButtons) {

            authButtons.style.display =
                "flex";

        }


        /* Hide user account */

        if (userAccount) {

            userAccount.style.display =
                "none";

        }

    }

}



/* CHECK LOGIN WHEN PAGE LOADS */

showLoggedInUser();