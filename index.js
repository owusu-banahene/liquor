const express = require("express");
const cors = require("cors");
const mongoClient = require("mongodb").MongoClient;
const connectionString =
  "mongodb+srv://Amazon_Liquor:Amazon_Liquor@amazonliquorcluster.g6efq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
//create the dummy server
server = express();
server.use(express.json());
server.use(cors());

//connecting to the database to perform CRUD
mongoClient
  .connect(connectionString, { useUnifiedTopology: true })
  .then((client) => {
    //create the database object
    const liquorDB = client.db("Amazon_Liquor");
    //create the three tables:product,customer and order
    const productTable = liquorDB.collection("Products_Collection");
    productTable.createIndex({ Brand: "text" });
    const customerTable = liquorDB.collection("Customer_Collection");
    const orderTable = liquorDB.collection("Orders_Collection");
    console.log("Connected to Database");

    //read from the database
    //products
    server.get("/products", (request, response) => {
      const productCursor = productTable
        .find({})
        .toArray()
        .then((data) => response.send(data));
    });
    //orders
    server.get("/orders", (request, response) => {
      const orderCursor = orderTable
        .find({})
        .toArray()
        .then((data) => response.send(data));
    });

    //customers
    server.get("/customers", (request, response) => {
      const customerCursor = customerTable
        .find({})
        .toArray()
        .then((data) => response.send(data));
    });

    //create new row(s)
    //add new product
    server.post("/products", (request, response) => {
      let {
        _id,
        brand,
        volume,
        alcohol_percentage,
        category,
        retail_price,
        url,
      } = request.body;
      if (_id === undefined) {
        return response.status(400).send("_id is required");
      }
      if (brand === undefined) {
        return response.status(400).send("brand is required");
      }
      if (volume === undefined) {
        return response.status(400).send("volume is required");
      }
      if (alcohol_percentage === undefined) {
        return response.status(400).send("alcohol percentage is required");
      }
      if (category === undefined) {
        return response.status(400).send("category is required");
      }
      if (retail_price === undefined) {
        return response.status(400).send("retail price is required");
      }
      if (url === undefined) {
        return response.status(400).send("url is required");
      }
      let insertRecord = {
        _id: parseInt(_id),
        Brand: brand,
        Volume: volume,
        Alcohol_Percentage: alcohol_percentage,
        Category: category,
        Retail_Price: retail_price,
        Url: url,
      };
      productTable
        .insertOne(insertRecord)
        .then((status) => {
          response.send({ message: "success" });
        })
        .catch((err) => response.status(400).send(err));
    });

    //order
    server.post("/orders", (request, response) => {
      let { _id, product_details, total_price, order_date, shipping_info } =
        request.body;
      if (_id === undefined) {
        return response.status(400).send("_id is required");
      }
      if (shipping_info === undefined) {
        return response.status(400).send("shipping information is required");
      }
      if (product_details === undefined) {
        return response.status(400).send("product_details is required");
      }

      if (total_price === undefined) {
        return response.status(400).send("total_price is required");
      }
      if (order_date === undefined) {
        return response.status(400).send("order_date is required");
      }
      //console.log(typeof product_details);
      //generate array of object with product_id and quantity
      let products = generateProductArray(product_details);
      let shipping = generateShippingInformation(shipping_info);
      //create the order record for the database
      let orderRecord = {
        _id: parseInt(_id),
        Products: products,
        Total_Price: parseFloat(total_price),
        Order_Date: order_date,
        Shipping_Info: shipping,
      };
      orderTable
        .insertOne(orderRecord)
        .then((status) => response.send({ message: "success" }))
        .catch((err) => response.status(400).send(err));
    });

    server.post("/customers", (request, response) => {
      //deconstructe the request body
      let { _id, first_name, last_name, email, phone, address } = request.body;
      if (_id === undefined) {
        return response.status(400).send("_id is required");
      }
      if (first_name === undefined) {
        return response.status(400).send("first_name is required");
      }
      if (last_name === undefined) {
        return response.status(400).send("last_name is required");
      }
      if (email === undefined) {
        return response.status(400).send("email is required");
      }
      let customerRecord = {
        _id: parseInt(_id),
        First_Name: first_name,
        Last_Name: last_name,
        Email: email,
      };
      if (phone !== undefined) {
        customerRecord["Phone"] = phone;
      }
      if (address !== undefined) {
        customerRecord["Address"] = address;
      }
      customerTable
        .insertOne(customerRecord)
        .then((status) => response.send({ message: "success" }))
        .catch((err) => response.status(400).send(err));
    });

    //search for items
    server.get("/products/search", (request, response) => {
      let query = {};
      let _id = request.body._id || request.query._id;
      if (_id !== undefined) {
        query["_id"] = parseInt(_id);
      }
      let brand = request.query.brand || request.body.brand;
      let volume = request.query.volume || request.body.volume;
      let alcohol_percentage =
        request.query.alcohol_percentage || request.body.alcohol_percentage;
      let category = request.query.category || request.body.category;
      let retail_price =
        request.query.retail_price || request.body.retail_price;
      if (brand !== undefined) {
        brand = brand[0].toUpperCase() + brand.slice(1).toLowerCase();
        query["Brand"] = brand;
      }

      if (volume !== undefined) {
        query["Volume"] = volume;
      }
      if (alcohol_percentage !== undefined) {
        query["Alcohol_Percentage"] = alcohol_percentage;
      }
      if (category !== undefined) {
        category = category[0].toUpperCase() + category.slice(1).toLowerCase();
        query["Category"] = category;
      }
      if (retail_price !== undefined) {
        query["Retail_Price"] = retail_price;
      }
      const productCursor = productTable
        .find(query)
        .toArray()
        .then((data) => response.send(data))
        .catch((err) => response.status(400).send(err));
    });

    //orders
    server.get("/orders/search", (request, response) => {
      let params = {};
      let _id = request.body._id || request.query._id;
      if (_id === undefined) {
        return response.status(400).send("order ID is required");
      }
      if (_id !== undefined) {
        params["_id"] = parseInt(_id);
      }
      console.log(params);
      const orderCursor = orderTable
        .find(params)
        .toArray()
        .then((data) => {
          if (data.length === 0) {
            response.send(`Sorry, order with ID ${_id} does not exist`);
          } else {
            response.send(data);
          }
        })
        .catch((err) => response.status(400).send(err));
    });

    //customers
    server.get("/customers/search", (request, response) => {
      let queryParameters = {};
      // response.send(request.query || request.body);
      let _id = request.body._id || parseInt(request.query._id);
      let email = request.body.email || request.query.email;
      if (_id === undefined && email === undefined) {
        return response
          .status(400)
          .send("Either the _id or email must be provided");
      }
      if (_id !== undefined) {
        queryParameters["_id"] = _id;
      }
      if (email !== undefined) {
        queryParameters["Email"] = email;
      }
      //response.send(queryParameters);
      customerTable
        .find(queryParameters)
        .toArray()
        .then((data) => {
          if (data.length === 0) {
            response
              .status(200)
              .send(`Customer with ID ${_id} or ${email} does not exist`);
          } else {
            response.send(data);
          }
        })
        .catch((err) => {
          response.status(400).send(err);
        });
    });

    //update items in the database
    //products
    server.put("/products/update", (request, response) => {
      let queryParam = {};
      let keyPara = {};
      let _id = request.query._id || request.body._id;
      let brand = request.query.brand || request.body.brand;
      let volume = request.query.volume || request.body.volume;
      let alcohol_percentage =
        request.query.alcohol_percentage || request.body.alcohol_percentage;
      let category = request.query.category || request.body.category;
      let retail_price =
        request.query.retail_price || request.body.retail_price;
      let url = request.body.url || request.body.url;
      // let { brand, volume, alcohol_percentage, category, retail_price } =
      //   request.body;
      if (_id === undefined) {
        return response.status(400).send("_id is required");
      }
      keyPara["_id"] = parseInt(_id);
      if (brand !== undefined) {
        queryParam["Brand"] =
          brand[0].toUpperCase() + brand.slice(1).toLowerCase();
      }
      if (volume !== undefined) {
        queryParam["Volume"] = volume;
      }
      if (alcohol_percentage !== undefined) {
        queryParam["Alcohol_Percentage"] = alcohol_percentage;
      }
      if (category !== undefined) {
        queryParam["Category"] =
          category[0].toUpperCase() + category.slice(1).toLowerCase();
      }
      if (retail_price !== undefined) {
        queryParam["Retail_Price"] = retail_price;
      }
      if (url !== undefined) {
        queryParam["URL"] = url;
      }

      productTable
        .updateOne(keyPara, {
          $set: queryParam,
        })
        .then((data) => {
          if (data["matchedCount"] > 0) {
            response.send(`${data["matchedCount"]} record(s) updated`);
          } else {
            response.send("No record was updated");
          }
        })
        .catch((err) => response.status(404).send(err));
    });

    //orders
    server.put("/orders/update", (request, response) => {
      let orderParams = {};
      let keyPara = {};
      let _id = request.query._id || request.body._id;
      let { product_details, total_price, order_date, shipping } = request.body;
      if (_id === undefined) {
        return response.status(400).send("_id is required");
      }
      keyPara["_id"] = parseInt(_id);
      if (product_details !== undefined) {
        orderParams["Products"] = generateProductArray(product_details);
      }
      if (total_price !== undefined) {
        orderParams["Total_Price"] = parseFloat(total_price);
      }
      if (order_date !== undefined) {
        orderParams["Order_Date"] = order_date;
      }
      if (shipping !== undefined) {
        orderParams["Shipping_Info"] = generateShippingInformation(shipping);
      }

      orderTable
        .updateOne(keyPara, {
          $set: orderParams,
        })
        .then((data) => {
          if (data["matchedCount"] > 0) {
            response
              .status(200)
              .send(`${data["matchedCount"]} record(s) updated`);
          } else {
            response.status(200).send("No record updated");
          }
        })
        .catch((err) => response.status(400).send(err));
    });

    //customers
    server.put("/customers/update", (request, response) => {
      let customerParams = {};
      let keyPara = {};
      let _id = request.query._id || request.body._id;
      let { email, phone, address } = request.body;
      if (_id === undefined) {
        return response.status(400).send("?_id is required");
      }
      keyPara["_id"] = parseInt(_id);
      if (email !== undefined) {
        customerParams["Email"] = email;
      }
      if (phone !== undefined) {
        customerParams["Phone"] = phone;
      }
      if (address !== undefined) {
        customerParams["Address"] = address;
      }

      customerTable
        .updateOne(keyPara, {
          $set: customerParams,
        })
        .then((data) => {
          if (data["matchedCount"] > 0) {
            response
              .status(200)
              .send(`${data["matchedCount"]} record(s) updated`);
          } else {
            response.status(200).send(`No was record updated`);
          }
        })
        .catch((err) => response.send(err));
    });

    //delete item from the database
    //products
    server.delete("/products/delete", (request, response) => {
      let key = {};
      let _id = request.body._id || request.query._id;
      if (_id === undefined) {
        return response
          .status(400)
          .send("_id is required in order to delete a record");
      }
      key["_id"] = parseInt(_id);
      productTable
        .deleteOne(key)
        .then((status) => {
          if (status["deletedCount"] > 0) {
            response
              .status(200)
              .send(`${status["deletedCount"]} record(s) deleted`);
          } else {
            response.status(200).send(`No record deleted`);
          }
        })
        .catch((err) => response.send(err));
    });

    //orders
    server.delete("/orders/delete", (request, response) => {
      let orderKey = {};
      let _id = request.body._id || request.query._id;

      if (_id === undefined) {
        return response
          .status(400)
          .send("_id is required in order to delete a record");
      }
      orderKey["_id"] = parseInt(_id);
      orderTable
        .deleteOne(orderKey)
        .then((status) => {
          if (status["deletedCount"] > 0) {
            response
              .status(200)
              .send(`${status["deletedCount"]} record(s) deleted`);
          } else {
            response.status(200).send(`No record deleted`);
          }
        })
        .catch((err) => response.send(err));
    });

    //customers
    server.delete("/customers/delete", (request, response) => {
      let customerKey = {};
      let _id = request.body._id || request.query._id;
      if (_id === undefined) {
        return response
          .status(400)
          .send("_id is required in order to delete a record");
      }
      customerKey["_id"] = parseInt(_id);
      customerTable
        .deleteOne(customerKey)
        .then((status) => {
          if (status["deletedCount"] > 0) {
            response
              .status(200)
              .send(`${status["deletedCount"]} record(s) deleted`);
          } else {
            response.status(200).send(`No record deleted`);
          }
        })
        .catch((err) => response.send(err));
    });
  })
  .catch((err) => console.error(err));

//generate the product object
function generateProductArray(products) {
  let order_product_detail = [];
  for (let product of products.split(";")) {
    //create a new object
    let eachItem = {};
    //split each product into product_id and quantity
    let item = product.split(",");
    eachItem["product_id"] = parseInt(item[0]);
    eachItem["quantity"] = parseInt(item[1]);
    order_product_detail.push(eachItem);
  }
  return order_product_detail;
}

function generateShippingInformation(information) {
  //create shipping object
  let shipping = {};
  let info = information.split(":");
  shipping["first_name"] = info[0];
  shipping["last_name"] = info[1];
  shipping["email"] = info[2];
  shipping["phone"] = info[3];
  shipping["address"] = info[4];
  return shipping;
}
const available_port = process.env.PORT || 3000;
//dummy server listening to any available port
server.listen(available_port, () => {
  console.log(`Listing to port: ${available_port}`);
});
