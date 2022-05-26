
const PRIMAVERA_ERROR_MESSAGE = {
    INPUT : {
        NULL_PARAMETER : "The first parameter value is null. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_INPUT : "The first parameter value is not an \"input\" tag. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_TYPE : "The first parameter attribute is not the \"file\" attribute. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
    },
    EVENT : {
        NULL_PARAMETER : "The second parameter value is null. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_TYPE : "The second parameter is not a function. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
    }
}

class PrimaveraParser {
    #IsEmptyInput = (input) => { if(input == null) throw new Error(PRIMAVERA_ERROR_MESSAGE.INPUT.NULL_PARAMETER); }
    #IsInput = (input) => { if(input.tagName.toLowerCase() != "input") throw new Error(PRIMAVERA_ERROR_MESSAGE.INPUT.NOT_INPUT); }
    #IsValidInputType = (input) => { if(input.getAttribute("type") != "file") throw new Error(PRIMAVERA_ERROR_MESSAGE.INPUT.NOT_TYPE); }
    #IsEmptyEvent = (event) => { if(event == null) throw new Error(PRIMAVERA_ERROR_MESSAGE.EVENT.NULL_PARAMETER); }
    #IsValidEventType = (event) => { if( (event instanceof Function) == false ) throw new Error(PRIMAVERA_ERROR_MESSAGE.EVENT.NOT_TYPE); }

    #CheckInput = (input) => {
        this.#IsEmptyInput(input);
        this.#IsInput(input);
        this.#IsValidInputType(input);
    }
    #CheckEvent = (event) => {
        this.#IsEmptyEvent(event);
        this.#IsValidEventType(event);
    }
    
    constructor(input,customEvent,code){

        this.#CheckInput(input);
        this.#CheckEvent(customEvent);

        const XMLParser = this.#XMLParser;
        input.onchange = function(e){
            
            const files = e.target.files;
            
            if(files.length == 0){
                input.value = null;
                return null;
            }
            if(e.target.files[0].name.slice(-4) != ".xml"){
                input.value = null;
                return null;
            }

            const fileReader = new FileReader();

            fileReader.onload = function(){
                XMLParser(input,fileReader.result,customEvent,code);
            };

            fileReader.readAsText(files[0],"UTF-8");   

            input.value = null;

        };
    }

    #XMLParser = (input,xmlData,customEvent,code) => {
        let parser = new DOMParser();
        let xml = parser.parseFromString(xmlData,"text/xml");
        let activities  = this.#XMLCheck(xml,input);
        let activities_length = activities.length;
        var activitiyObjects = new Array();

        for(let i = 0; i < activities_length; i++){

            let activity = activities[i];    
            var activityId = activity.getElementsByTagName("Id")[0].childNodes[0].nodeValue;

            if(activityId.slice(0,code.length) == code){

                let activityObject = new Object();

                let actualStartDate = activity.getElementsByTagName("ActualStartDate")[0].childNodes[0];

                if( actualStartDate != undefined ){
                    actualStartDate = this.#SimleDateFormat(actualStartDate.nodeValue);
                }else{
                    actualStartDate = "";
                }

                let actualFinishDate = activity.getElementsByTagName("ActualFinishDate")[0].childNodes[0];

                if( actualFinishDate != undefined){
                    actualFinishDate = this.#SimleDateFormat(actualFinishDate.nodeValue);
                }else{
                    actualFinishDate = "";
                }
                
                let plannedStartDate = this.#SimleDateFormat( activity.getElementsByTagName("PlannedStartDate")[0].childNodes[0].nodeValue );
                let plannedFinishDate = this.#SimleDateFormat( activity.getElementsByTagName("PlannedFinishDate")[0].childNodes[0].nodeValue );
                let activityName = activity.getElementsByTagName("Name")[0].childNodes[0].nodeValue;

                activityObject.activityId = activityId;
                activityObject.actualStartDate = actualStartDate;
                activityObject.actualFinishDate = actualFinishDate;
                activityObject.plannedStartDate = plannedStartDate;
                activityObject.plannedFinishDate = plannedFinishDate;
                activityObject.activityName = activityName;

                activitiyObjects.push(activityObject);

            }

        }

        activitiyObjects = this.#SortSchedule(activitiyObjects);
        customEvent(activitiyObjects);
    }

    #SimleDateFormat = (date) => {

        date = new Date(date);
        if( date == NaN){
            throw new Error("There is no schedule assigned to the activity object.");
        }

        let year = date.getFullYear();
        let month = date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) :  date.getMonth()+1;
        let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        return year + "-" + month + "-" + day;

    }

    #XMLCheck = (xml,input) => {

        if( xml.documentElement.nodeName.includes("html") ){
            input.value = null;
            throw new Error("This file is not suitable for XML format.");
        }

        let project = xml.documentElement.getElementsByTagName("Project")[0];
        if(project == undefined){
            input.value = null;
            throw new Error("No \"Project\" node was found in this XML file.");
        }

        let activities = project.getElementsByTagName("Activity");
        if(activities == undefined){
            input.value = null;
            throw new Error("No \"Activity\" node was found in this XML file.");
        }

        return activities;

    }

    #SortSchedule = (activities) => {

        activities.sort(function(a,b){
  
            if(new Date(a["plannedStartDate"]) < new Date(b["plannedStartDate"])){
                    return -1;
            }

            if(a["plannedStartDate"] == b["plannedStartDate"]){
                
                if(a["plannedFinishDate"] == b["plannedFinishDate"]){

                    if(parseInt(a["activityId"].replace(/[^0-9]/g,"")) < parseInt(b["activityId"].replace(/[^0-9]/g,""))){
                        return -1;
                    }
    
                    if(parseInt(a["activityId"].replace(/[^0-9]/g,"")) > parseInt(b["activityId"].replace(/[^0-9]/g,""))){
                        return 1;
                    }

                }else{

                    if(new Date(a["plannedFinishDate"]) < new Date(b["plannedFinishDate"])){
                        return 1;
                    }

                    if(new Date(a["plannedFinishDate"]) > new Date(b["plannedFinishDate"])){
                        return -1;
                    }


                }



            }

            if(new Date(a["plannedStartDate"]) > new Date(b["plannedStartDate"])){
                return 1;
            }

        })

        return activities;
    }

}