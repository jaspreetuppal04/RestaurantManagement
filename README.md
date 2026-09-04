# The Fat Turtle – Restaurant Management Website

A responsive and interactive restaurant and café website built using **HTML, CSS, JavaScript, Bootstrap 5, and Vue.js**. The project provides menu browsing, ordering functionality, user authentication, drag-and-drop ordering, browser-based location detection, and Vue.js custom directives.

## Features

* Interactive restaurant menu
* Add food items to orders
* Remove items from the order
* Bill section with grand total calculation
* Drag-and-drop food ordering
* User Sign Up and Login
* Logout functionality
* User data stored using browser `localStorage`
* Password validation
* Browser geolocation
* Responsive layout using Bootstrap 5
* Restaurant contact and location section
* **10% discount coupon using a Vue.js custom directive**
* **Chef's Specials section dynamically generated using a Vue.js custom directive**

## Vue.js Practical Features

This project also implements Vue.js custom directives for Practical 7.

### 1. `v-uppercase`

The custom `v-uppercase` directive is applied to the **FAT10** discount coupon. When the user clicks the coupon code, its text is converted to uppercase.

### 2. `v-list`

The custom `v-list` directive dynamically creates the **Chef's Specials** list using data from the Vue application. Each special item includes:

* Food image
* Food name

The current Chef's Specials are:

* Creamy Alfredo Pasta
* Strawberry Mojito

## Technologies Used

* HTML5
* CSS3
* JavaScript
* Vue.js 3
* Bootstrap 5
* Browser Local Storage
* Geolocation API

## Project Structure

```text
RestaurantManagement/
│
├── index.html
├── style.css
├── script.js
├── README.md
│
├── Burger.jpeg
├── Coffee.jpeg
├── Fries.jpeg
├── Nachos.jpeg
├── Pizza.jpeg
├── Sandwich.jpeg
├── Shake.jpeg
├── brownies.jpeg
├── cheesecake.jpeg
├── AlfredoPasta.jpeg
├── StrawberryMojito.jpeg
└── TheFatTurtle.JPG
```

## How It Works

### Menu & Orders

Users can browse the available menu items and add them to their order. Items can also be added using the drag-and-drop area. The selected items are displayed in the order section, along with a bill and grand total.

### Discount Coupon

The website includes a special **10% OFF** coupon. A Vue.js custom directive called `v-uppercase` makes the coupon code interactive and converts its text to uppercase when clicked.

### Chef's Specials

The Chef's Specials section uses the custom `v-list` Vue directive. The directive dynamically generates special food items from the Vue application's data, including their images and names.

### User Authentication

Users can create an account with their name, mobile number, email, password, and address. Login and logout functionality is implemented using JavaScript and browser `localStorage`.

### Location Detection

The website uses the browser's **Geolocation API** to retrieve the user's latitude and longitude.

## Running the Project

Clone the repository:

```bash
git clone https://github.com/jaspreetuppal04/RestaurantManagement.git
```

Open the project folder and launch `index.html` in a web browser.

For the best experience, run the project using a local development server such as **VS Code Live Server**.

## Note

This project is a **front-end demonstration**. User accounts and order data are handled locally in the browser and are not connected to a backend database.

## Future Improvements

* Backend integration with a database
* Persistent order management
* Online payment integration
* Restaurant admin dashboard
* Order history
* Improved authentication and security
* Deployment using GitHub Pages or another hosting platform

## Author

**Jaspreet Uppal**

GitHub: [@jaspreetuppal04](https://github.com/jaspreetuppal04)
