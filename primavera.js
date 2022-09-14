const PRIMAVERA_ERROR_MESSAGE = {
    INPUT : {
        NULL_PARAMETER : "The first parameter value is null. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_INPUT : "The first parameter value is not an \"input\" tag. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_TYPE : "The first parameter attribute is not the \"file\" attribute. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
    },
    EVENT : {
        NULL_PARAMETER : "The second parameter value is null. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
        , NOT_TYPE : "The second parameter is not a function. This class takes two parameters, the first argument requires an \"input\" tag with a \"file\" attribute, and the second argument requires a function to be executed after the operation is complete."
    },
    XML : {
        NOT_FORMAT : "This file is not suitable for XML format."
        , NOT_FIND_PROJECT_TAG : "No \"Project\" node was found in this XML file."
        , NOT_FIND_ACTIVITY_TAG : "No \"Activity\" node was found in this XML file."
    },
    DATE : {
        NOT_TYPE : "There is no schedule assigned to the activity object."
    }
}

class Activity {
    id;
    name;
    actualStartDate = '';
    actualFinishDate = '';
    plannedStartDate;
    plannedFinishDate;

    constructor(){

    }
}

class WBS {
    id = '';
    children = new Array();

    constructor(id){
        this.id = id;
    }

    Append(data){
        const TYPE_CHECK = data instanceof Activity || data instanceof WBS;
        if(!TYPE_CHECK){
            throw new Error('IS NOT Activity OR WBS!!!');
        }
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

            const file = e.target.files[0];
            if(file.type != "text/xml"){
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

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlData,"text/xml");
        const activities  = this.#XMLCheck(xml,input);
        const activitiesLength = activities.length;
        const activitiyObjects = new Array();

        for(let i = 0; i < activitiesLength; i++){

            const activity = activities[i];    
            const activityId = activity.getElementsByTagName("Id")[0].childNodes[0].nodeValue;

            if(activityId.slice(0,code.length) == code){

                const activityObject = new Activity();

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
                
                const plannedStartDate = this.#SimleDateFormat( activity.getElementsByTagName("PlannedStartDate")[0].childNodes[0].nodeValue );
                const plannedFinishDate = this.#SimleDateFormat( activity.getElementsByTagName("PlannedFinishDate")[0].childNodes[0].nodeValue );
                let activityName = activity.getElementsByTagName("Name")[0].childNodes[0].nodeValue;

                activityObject.id = activityId;
                activityObject.actualStartDate = actualStartDate;
                activityObject.actualFinishDate = actualFinishDate;
                activityObject.plannedStartDate = plannedStartDate;
                activityObject.plannedFinishDate = plannedFinishDate;
                activityObject.name = activityName;

                activitiyObjects.push(activityObject);

            }

        }

        activitiyObjects.sort(this.#SortSchedule);
        customEvent(activitiyObjects);
    }

    #SimleDateFormat = (date) => {

        date = new Date(date);
        if( date == NaN){
            throw new Error(PRIMAVERA_ERROR_MESSAGE.DATE.NOT_TYPE);
        }

        let year = date.getFullYear();
        let month = date.getMonth()+1 < 10 ? "0" + (date.getMonth()+1) :  date.getMonth()+1;
        let day = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();

        return year + "-" + month + "-" + day;

    }

    #XMLCheck = (xml,input) => {

        if( xml.documentElement.nodeName.includes("html") ){
            input.value = null;
            throw new Error(PRIMAVERA_ERROR_MESSAGE.XML.NOT_FORMAT);
        }

        let project = xml.documentElement.getElementsByTagName("Project")[0];
        if(project == undefined){
            input.value = null;
            throw new Error(PRIMAVERA_ERROR_MESSAGE.XML.NOT_FIND_PROJECT_TAG);
        }

        let activities = project.getElementsByTagName("Activity");
        if(activities == undefined){
            input.value = null;
            throw new Error(PRIMAVERA_ERROR_MESSAGE.XML.NOT_FIND_ACTIVITY_TAG);
        }

        return activities;

    }

    #SortSchedule = (a,b) => {

        const plannedStartDateA = new Date(a.plannedStartDate);
        const plannedStartDateB = new Date(b.plannedStartDate);
    
        if(plannedStartDateA < plannedStartDateB) return -1;
        if(plannedStartDateA > plannedStartDateB) return 1;

        const plannedFinishDateA = new Date(a.plannedFinishDate);
        const plannedFinishDateB = new Date(b.plannedFinishDate);

        if(plannedFinishDateA > plannedFinishDateB) return -1;
        if(plannedFinishDateA < plannedFinishDateB) return 1;

        const activityIdA = parseInt(a.id.replace(/[^0-9]/g,""));
        const activityIdB = parseInt(b.id.replace(/[^0-9]/g,""));

        if( activityIdA < activityIdB ) return -1;
        return 1;

    }

}