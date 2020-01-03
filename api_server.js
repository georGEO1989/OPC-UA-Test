// OPC-UA requirments
const { OPCUAClient, AttributeIds } = require('node-opcua');
const opcua = require('node-opcua');

// API requirments
var express = require('express');
var app = express();

// Update indicating that tech has arrived and started work on the machine
app.get('/opc-api/techupdate', function (request, response) {
    async function writeTechArrived(machine, status) {
        try {
            // Create client
            const client = OPCUAClient.create({
                endpoint_must_exist: false
            });

            // Connect client
            const endpoint = "opc.tcp://GOFFLEY-T430RE1.cdf1.local:4337/UA/TabletServ";
            await client.connect(endpoint);
            console.log("Connected to endpoint")

            // Create session
            const session = await client.createSession();

            // Set NodeId
            var nodePrefix = "ns=1;i=1";
            var nodeId = nodePrefix.concat(machine);

            //// This works but it updates all the nodes instead of just one
            //const nodesToWrite = [];
            //nodesToWrite.push({
            //    nodeId: nodeId,
            //    attributeId: opcua.AttributeIds.Value,
            //    value: {
            //        value: {
            //            dataType: opcua.DataType.String,
            //            value: status
            //        }
            //    },
            //    statusCode: opcua.StatusCodes.Good
            //});

            //let writeVal = await session.write(nodesToWrite);

            // Testing single node
            const dataToWrite = {
                dataType: opcua.DataType.String,
                value: status,
            }

            try {
                await session.writeSingleNode(nodeId, dataToWrite, function (error, statusCode, diag) {
                    if (!error) {
                        console.log(" Write ok ");
                    } else {
                        console.log(" Write error: ", error);
                    }
                });
            }
            catch (error) {
                console.log("Error Writing Single Node: ", error);
            }

            // Close Session
            await session.close();

            // Disconnection
            await client.disconnect();
        }
        catch (err) {
            console.log("Error getting value: ", err);
            response.send("Error Updating tag");
        }
    };

    try {
        writeTechArrived(request.param('machine'), request.param('status'));
    }
    catch (error) {
        console.log("Error updating tag: ", error);
        response.send("Error Updating tag");
    }
    finally {
        console.log(response.statusCode);
        response.send("Updated tag");
    }
});


app.get('/readval', (request, response) => {
    //return res.send("Received a get http request");

    // Connectm read something close connection
    var returnValue;

    (async () => {
        try {
            // Create client
            const client = OPCUAClient.create({
                endpoint_must_exist: false
            });

            // Connect client
            const endpoint = "opc.tcp://GOFFLEY-T430RE1.cdf1.local:4334/UA/TabletServ";
            await client.connect(endpoint);
            console.log("Connected to endpoint")

            // Create session
            const session = await client.createSession();

            // Read values
            const dataValue = await session.read({
                nodeId: "ns=1;b=1101",
                attributeId: AttributeIds.Value
            });
            if (!dataValue) {
                console.log("No Value");
            }
            else {
                console.log("Value read");
            }
            returnValue = dataValue.value.toString();
            return response.send(returnValue);

            // Close Session
            await session.close();

            // Disconnection
            await client.disconnect();
        }
        catch (err) {
            console.log("Error getting value: ",err);
        }
    })();

    // Return Statement
    console.log(response.statusCode);
});

var server = app.listen(8081, function () {
    var host = server.address().address
    var port = server.address().port
    console.log("Example app listening at http://%s:%s", host, port)
});