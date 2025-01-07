export async function getRecords(reportName, criteria) {
    try {
     await ZOHO.CREATOR.init();
     const config = {
        appName: "order-management",
        reportName: reportName,
        criteria: criteria
     }
     const response = await ZOHO.CREATOR.API.getAllRecords(config);
     if(response.code !== 3000){
        console.log("Error Fetching Records");
        return [];
     }
     return response.data;
    } catch (error) {
        console.log(error);
        return [];
    }
}

export async function getRecordUsingID(reportName, id) {
    try {
        await ZOHO.CREATOR.init();
        const config = {
           appName: "order-management",
           reportName: reportName,
           id: id
        }
        const response = await ZOHO.CREATOR.API.getRecordById(config);
        if(response.code !== 3000){
           console.log("Error Fetching Records");
           return {};
        }
        return response.data;
       } catch (error) {
           console.log(error);
           return {};
       }
}

export async function postRecord(formName, formData) {
    try {
        await ZOHO.CREATOR.init();
        const config = {
           appName: "order-management",
           formName: formName,
           data: formData
        }
        const response = await ZOHO.CREATOR.API.addRecord(config);
        if(response.code !== 3000){
           console.log("Error Adding Records");
           return {};
        }
        return response.data;
       } catch (error) {
           console.log(error);
           return null;
       }
}