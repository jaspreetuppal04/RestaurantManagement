/* FOOD PRICES */

const foodPrices = {
    "Couscous Chickpea Salad": 249,
    "Fattoush Salad": 229,
    "Cheese Fatayer": 299,
    "Mezze Platter": 249,
    "Falafel Hummus Wrap": 249,
    "Vegan Avocado Toast with Beet Hummus": 279,
    "Turkish Coffee": 119,
    "Classic Kunafa": 249,
    "Turkish Affogato": 249,
    "Eggplant Moussaka": 499,
    "Baklava With IceCream": 299
};


/* STORE ORDERS */

let orders = [];


/* ADD FOOD ITEM TO ORDER */

function addOrder(foodName) {

    foodName = foodName.trim();

    const existingOrder =
        orders.find(
            order => order.name === foodName
        );

    /* If item already exists, increase quantity */

    if (existingOrder) {

        existingOrder.quantity++;

    }

    else {

        orders.push({

            name: foodName,

            price: foodPrices[foodName],

            quantity: 1

        });

    }


    updateOrders();

}

/* UPDATE ORDERS AND BILL */

function updateOrders() {

    const orderList =
        document.getElementById("orderList");


    const billDetails =
        document.getElementById("billDetails");


    const totalAmount =
        document.getElementById("totalAmount");


    /* Clear previous data */

    orderList.innerHTML = "";

    billDetails.innerHTML = "";


    let grandTotal = 0;


    orders.forEach(
        function (order, index) {


            /* Calculate item total */

            const itemTotal =
                order.price *
                order.quantity;


            grandTotal += itemTotal;


            /* CREATE ORDER ITEM */

            const listItem =
                document.createElement("li");


            listItem.innerHTML =

                "<strong>" +
                order.name +
                "</strong>" +

                " | ₹" +
                order.price +

                " | Quantity: " +
                order.quantity +

                " | Total: ₹" +
                itemTotal;


            /* QUANTITY DECREASE BUTTON */

            const decreaseButton =
                document.createElement("button");

            decreaseButton.textContent =
                "-";


            decreaseButton.onclick =
                function () {

                    if (order.quantity > 1) {

                        order.quantity--;

                    }

                    else {

                        orders.splice(index, 1);

                    }

                    updateOrders();

                };


            /* QUANTITY INCREASE BUTTON */

            const increaseButton =
                document.createElement("button");

            increaseButton.textContent =
                "+";


            increaseButton.onclick =
                function () {

                    order.quantity++;

                    updateOrders();

                };


            /* REMOVE BUTTON */

            const removeButton =
                document.createElement("button");

            removeButton.textContent =
                "Remove";


            removeButton.onclick =
                function () {

                    orders.splice(index, 1);

                    updateOrders();

                };


            /* ADD BUTTONS */

            listItem.appendChild(
                decreaseButton
            );

            listItem.appendChild(
                increaseButton
            );

            listItem.appendChild(
                removeButton
            );


            /* ADD TO ORDER LIST */

            orderList.appendChild(
                listItem
            );


            /* CREATE BILL ITEM */

            const billItem =
                document.createElement("div");


            billItem.className =
                "bill-item";


            billItem.innerHTML =

                "<span>" +

                order.name +

                " × " +

                order.quantity +

                "</span>" +

                "<span>₹" +

                itemTotal +

                "</span>";


            billDetails.appendChild(
                billItem
            );

        }
    );


    /* UPDATE GRAND TOTAL */

    totalAmount.textContent =
        grandTotal;

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
        foodItem
            .querySelector("h3")
            .textContent
            .trim();


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


/* =====================================================
   PRACTICAL: GEOLOCATION API
   ===================================================== */


/* DEFAULT CAFE LOCATION */

const cafeLatitude = 23.0401;
const cafeLongitude = 72.5078;


/* GET CUSTOMER LOCATION */

function getLocation() {

    const result =
        document.getElementById(
            "locationResult"
        );


    /* Check browser support */

    if (!navigator.geolocation) {

        result.textContent =
            "Geolocation is not supported by your browser.";

        return;
    }


    result.textContent =
        "Getting your current location...";


    /* Get current location */

    navigator.geolocation.getCurrentPosition(

        function (position) {

            const userLatitude =
                position.coords.latitude;

            const userLongitude =
                position.coords.longitude;


            /* Calculate distance */

            const distance =
                calculateDistance(
                    userLatitude,
                    userLongitude,
                    cafeLatitude,
                    cafeLongitude
                );


            /* Estimate travel time */

            const estimatedTime =
                Math.round(
                    (distance / 25) * 60
                );


            /* Display result */

            result.innerHTML =

                "<strong>Distance to The Fat Turtle Cafe:</strong> " +

                distance.toFixed(2) +

                " km" +

                "<br>" +

                "<strong>Approximate travel time:</strong> " +

                estimatedTime +

                " minutes";


            /* Google Maps directions */

            const directions =
                document.getElementById(
                    "directionsLink"
                );


            directions.href =

                "https://www.google.com/maps/dir/?api=1" +

                "&origin=" +

                userLatitude +
                "," +
                userLongitude +

                "&destination=" +

                cafeLatitude +
                "," +
                cafeLongitude;


            directions.style.display =
                "inline-block";

        },


        function (error) {

            if (error.code === 1) {

                result.textContent =
                    "Location permission was denied. Please allow location access.";

            }

            else if (error.code === 2) {

                result.textContent =
                    "Your location could not be determined.";

            }

            else if (error.code === 3) {

                result.textContent =
                    "Location request timed out. Please try again.";

            }

            else {

                result.textContent =
                    "Unable to get your location.";
            }

        }

    );

}


/* =====================================================
   DISTANCE CALCULATION
   ===================================================== */

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const earthRadius = 6371;


    const latitudeDifference =
        toRadians(lat2 - lat1);


    const longitudeDifference =
        toRadians(lon2 - lon1);


    const a =

        Math.sin(
            latitudeDifference / 2
        ) *

        Math.sin(
            latitudeDifference / 2
        )

        +

        Math.cos(
            toRadians(lat1)
        ) *

        Math.cos(
            toRadians(lat2)
        ) *

        Math.sin(
            longitudeDifference / 2
        ) *

        Math.sin(
            longitudeDifference / 2
        );


    const c =

        2 *

        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );


    return earthRadius * c;
}


/* CONVERT DEGREES TO RADIANS */

function toRadians(degrees) {

    return degrees *
        Math.PI /
        180;
}




/* AUTHENTICATION: MYSQL BACKEND + SERVER SESSION */

const API_BASE = `http://${window.location.hostname || "localhost"}:3000`;

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        credentials: "include",
        headers: {
            ...(options.body ? { "Content-Type": "application/json" } : {}),
            ...(options.headers || {})
        }
    });

    let result = {};
    try { result = await response.json(); } catch (_) {}
    if (!response.ok) {
        throw new Error(result.message || "Request failed.");
    }
    return result;
}

const signupForm = document.getElementById("signupForm");

if (signupForm) {
    signupForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("signupMessage");
        const button = signupForm.querySelector('button[type="submit"]');
        const customer = {
            first_name: document.getElementById("firstName").value.trim(),
            mobile: document.getElementById("mobile").value.trim(),
            email: document.getElementById("email").value.trim(),
            password: document.getElementById("signupPassword").value,
            address: document.getElementById("address").value.trim()
        };

        if (message) {
            message.className = "mb-3";
            message.textContent = "Creating account...";
        }
        if (button) button.disabled = true;

        try {
            const result = await apiRequest("/api/signup", {
                method: "POST",
                body: JSON.stringify(customer)
            });

            if (message) {
                message.className = "mb-3 text-success";
                message.textContent = result.message;
            }

            signupForm.reset();

            // Close signup modal, then open login so the new customer can sign in.
            const signupModalElement = document.getElementById("signupModal");
            if (signupModalElement && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(signupModalElement);
                if (modal) modal.hide();
            }
            alert("Account created successfully. Please log in.");
            const loginModalElement = document.getElementById("loginModal");
            if (loginModalElement && window.bootstrap) {
                new bootstrap.Modal(loginModalElement).show();
            }
        } catch (error) {
            if (message) {
                message.className = "mb-3 text-danger";
                message.textContent = error.message;
            } else {
                alert(error.message);
            }
        } finally {
            if (button) button.disabled = false;
        }
    });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (event) {
        event.preventDefault();

        const message = document.getElementById("loginMessage");
        const button = loginForm.querySelector('button[type="submit"]');
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        if (message) {
            message.className = "mb-3";
            message.textContent = "Signing in...";
        }
        if (button) button.disabled = true;

        try {
            const result = await apiRequest("/api/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });

            // This is display-only cache. The server-side session is the authority.
            localStorage.setItem("fatTurtleUser", JSON.stringify(result.user));
            loginForm.reset();

            const modalElement = document.getElementById("loginModal");
            if (modalElement && window.bootstrap) {
                const modal = bootstrap.Modal.getInstance(modalElement);
                if (modal) modal.hide();
            }

            await showLoggedInUser();
            alert(`Welcome, ${result.user.firstName}!`);
        } catch (error) {
            if (message) {
                message.className = "mb-3 text-danger";
                message.textContent = error.message;
            } else {
                alert(error.message);
            }
        } finally {
            if (button) button.disabled = false;
        }
    });
}

async function logoutUser() {
    try {
        await apiRequest("/api/logout", { method: "POST" });
    } catch (error) {
        console.error("Logout error:", error);
    }

    localStorage.removeItem("fatTurtleUser");
    localStorage.removeItem("fatTurtleLoggedIn");
    closeAccountPage();
    showLoggedOutHeader();
    const history = document.getElementById("orderHistoryList");
    if (history) history.textContent = "Log in to view your saved orders.";
    alert("You have been logged out successfully.");
}

function showLoggedOutHeader() {
    const authButtons = document.getElementById("authButtons");
    const userAccount = document.getElementById("userAccount");
    if (authButtons) authButtons.style.display = "flex";
    if (userAccount) userAccount.style.display = "none";
}

async function showLoggedInUser() {
    const authButtons = document.getElementById("authButtons");
    const userAccount = document.getElementById("userAccount");
    const welcome = document.getElementById("userWelcome");

    try {
        const result = await apiRequest("/api/me");
        const user = result.user;
        localStorage.setItem("fatTurtleUser", JSON.stringify(user));
        localStorage.setItem("fatTurtleLoggedIn", "true");

        if (authButtons) authButtons.style.display = "none";
        if (userAccount) userAccount.style.display = "block";
        if (welcome) welcome.textContent = `Welcome, ${user.firstName}`;
        return user;
    } catch (_) {
        localStorage.removeItem("fatTurtleLoggedIn");
        localStorage.removeItem("fatTurtleUser");
        showLoggedOutHeader();
        return null;
    }
}

async function openAccountPage() {
    const accountPage = document.getElementById("accountPage");
    const loading = document.getElementById("accountLoading");
    const details = document.getElementById("accountDetails");
    const errorBox = document.getElementById("accountError");

    const userAccount = await showLoggedInUser();
    if (!userAccount) {
        alert("Please log in to view your account.");
        const modalElement = document.getElementById("loginModal");
        if (modalElement && window.bootstrap) new bootstrap.Modal(modalElement).show();
        return;
    }

    // Keep the existing restaurant page intact; only switch its main content visibility.
    document.querySelectorAll("body > header, body > .menu-feedback-container, body > section:not(#accountPage)")
        .forEach(element => element.dataset.accountHidden = element.style.display === "none" ? "yes" : "no");
    document.querySelectorAll("body > header, body > .menu-feedback-container, body > section:not(#accountPage)")
        .forEach(element => element.style.display = "none");

    accountPage.hidden = false;
    loading.hidden = false;
    details.hidden = true;
    errorBox.hidden = true;
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
        const result = await apiRequest("/api/me");
        const user = result.user;
        document.getElementById("accountFullName").textContent = user.firstName || "";
        document.getElementById("accountName").textContent = user.firstName || "";
        document.getElementById("accountEmail").textContent = user.email || "";
        document.getElementById("accountMobile").textContent = user.mobile || "";
        document.getElementById("accountAddress").textContent = user.address || "";
        document.getElementById("accountInitials").textContent =
            (user.firstName || "FT").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
        loading.hidden = true;
        details.hidden = false;
    } catch (error) {
        loading.hidden = true;
        errorBox.textContent = error.message;
        errorBox.hidden = false;
    }
}

function closeAccountPage() {
    const accountPage = document.getElementById("accountPage");
    if (accountPage) accountPage.hidden = true;
    document.querySelectorAll("body > header, body > .menu-feedback-container, body > section:not(#accountPage)")
        .forEach(element => {
            if (element.dataset.accountHidden !== undefined) {
                element.style.display = "";
                delete element.dataset.accountHidden;
            }
        });
}

function openMyOrders() {
    closeAccountPage();
    const ordersSection = document.getElementById("orders");
    if (ordersSection) ordersSection.scrollIntoView({ behavior: "smooth" });
    loadOrderHistory();
}

async function placeOrder() {
    const message = document.getElementById("placeOrderMessage");
    const button = document.getElementById("placeOrderButton");

    if (!orders.length) {
        if (message) {
            message.className = "text-danger";
            message.textContent = "Your cart is empty. Add food items before placing an order.";
        }
        return;
    }

    if (button) button.disabled = true;
    if (message) {
        message.className = "";
        message.textContent = "Saving your order...";
    }

    try {
        const result = await apiRequest("/api/orders", {
            method: "POST",
            body: JSON.stringify({
                items: orders.map(item => ({ name: item.name, quantity: item.quantity }))
            })
        });

        orders = [];
        updateOrders();
        if (message) {
            message.className = "text-success";
            message.textContent = `${result.message} Order #${result.orderId}, total ₹${result.totalAmount}.`;
        }
        await loadOrderHistory();
    } catch (error) {
        if (message) {
            message.className = "text-danger";
            message.textContent = error.message;
        }
        if (error.message.toLowerCase().includes("log in")) {
            const modalElement = document.getElementById("loginModal");
            if (modalElement && window.bootstrap) new bootstrap.Modal(modalElement).show();
        }
    } finally {
        if (button) button.disabled = false;
    }
}

async function loadOrderHistory() {
    const container = document.getElementById("orderHistoryList");
    if (!container) return;
    container.textContent = "Loading saved orders...";

    try {
        const result = await apiRequest("/api/orders");
        if (!result.orders.length) {
            container.textContent = "You have not placed any orders yet.";
            return;
        }

        container.replaceChildren();
        result.orders.forEach(order => {
            const card = document.createElement("div");
            card.className = "saved-order";

            const heading = document.createElement("div");
            heading.className = "saved-order-heading";

            const title = document.createElement("span");
            title.textContent = `Order #${order.id} · ₹${Number(order.totalAmount).toFixed(2)}`;

            const status = document.createElement("span");
            status.className = "order-status";
            status.textContent = order.status;

            const date = document.createElement("div");
            date.className = "text-muted small";
            date.textContent = order.createdAt ? new Date(order.createdAt).toLocaleString() : "";

            const items = document.createElement("div");
            items.className = "saved-order-items";
            items.textContent = order.items.map(item =>
                `${item.food_name} × ${item.quantity} (₹${Number(item.item_total).toFixed(2)})`
            ).join(" · ");

            heading.append(title, status);
            card.append(heading, date, items);
            container.appendChild(card);
        });
    } catch (error) {
        container.textContent = error.message;
    }
}

// Verify the server session every time the page opens; localStorage is not authentication.
document.addEventListener("DOMContentLoaded", async () => {
    await showLoggedInUser();
    const history = document.getElementById("orderHistoryList");
    if (history) {
        const user = await apiRequest("/api/me").then(result => result.user).catch(() => null);
        if (user) loadOrderHistory();
        else history.textContent = "Log in to view your saved orders.";
    }
});

/* PRACTICAL-6: FEEDBACK FORM + LOCAL STORAGE*/

const feedbackForm =
    document.getElementById("feedbackForm");

if (feedbackForm) {

    feedbackForm.addEventListener(
        "submit",
        function (event) {

            event.preventDefault();

            const name =
                document.getElementById("feedbackName").value.trim();

            const phone =
                document.getElementById("feedbackPhone").value.trim();

            const rating =
                document.getElementById("feedbackRating").value;

            const message =
                document.getElementById("feedbackMessage").value.trim();


            /* Get existing feedback */

            const existingFeedback =
                JSON.parse(
                    localStorage.getItem("restaurantFeedback")
                ) || [];


            /* Create new feedback */

            const feedback = {

                name: name,
                phone: phone,
                rating: rating,
                message: message

            };


            /* Add new feedback */

            existingFeedback.push(feedback);


            /* Save feedback in Local Storage */

            localStorage.setItem(
                "restaurantFeedback",
                JSON.stringify(existingFeedback)
            );


            alert("Thank you for your feedback!");


            /* Clear form */

            feedbackForm.reset();

        }
    );

}

// PRACTICAL-7: VUE CUSTOM DIRECTIVES

const { createApp } = Vue;


const app = createApp({

    data() {
        return {
specialItems: [
    {
        name: "Eggplant Moussaka",
        image: "Images/Eggplant-Moussaka.jpeg",
        price: 499
    },
    {
        name: "Baklava With IceCream",
        image: "Images/Baklava-With-IceCream.jpg",
        price: 299
    }
]
        };
    }

});


// Custom Directive 1: Convert coupon text to uppercase

app.directive('uppercase', {

    mounted(el) {

        el.style.cursor = 'pointer';

        el.addEventListener('click', () => {

            el.textContent = el.textContent.toUpperCase();

        });

    }

});


// Custom Directive 2: Dynamically create Chef's Specials list

app.directive('list', {
    mounted(el, binding) {

        binding.value.forEach(item => {

            const listItem = document.createElement('li');

            // Make Chef Special draggable
            listItem.setAttribute('draggable', 'true');

            listItem.addEventListener('dragstart', drag);

            // Image
            const image = document.createElement('img');
            image.src = item.image;
            image.alt = item.name;
            image.classList.add('special-image');

            // Name
            const name = document.createElement('h3');
            name.textContent = item.name;

            // Price
            const price = document.createElement('p');
            price.textContent = "₹" + item.price;

            // Add to Order button
            const button = document.createElement('button');
            button.textContent = "Add to Order";

            button.addEventListener('click', function () {
                addOrder(item.name);
            });

            // Add everything to the Chef Special item
            listItem.appendChild(image);
            listItem.appendChild(name);
            listItem.appendChild(price);
            listItem.appendChild(button);

            el.appendChild(listItem);
        });

    }
});

// Mount Vue to the Practical-7 area

app.mount('#practical7');