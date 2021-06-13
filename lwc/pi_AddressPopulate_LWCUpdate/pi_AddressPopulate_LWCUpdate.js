import { LightningElement, track, wire, api } from "lwc";
//Reason:Relationship changed
//LastModifed on: 08-Feb-2020
//LastModifed By: Vivek S


import getStateNames from '@salesforce/apex/PI_AddressPopulateHelper.getStateNames';
import returnCities from '@salesforce/apex/PI_AddressPopulateHelper.returnCities';
import returnAreaAndPincode from '@salesforce/apex/PI_AddressPopulateHelper.returnAreaAndPincode';
import updatesObjectAddress from '@salesforce/apex/PI_AddressPopulateHelper.updatesObjectAddress';
import getAddressDetails from '@salesforce/apex/PI_AddressPopulateHelper.getAddressDetails';
import getAddressprepopulateDetails from '@salesforce/apex/PI_AddressPopulateHelper.getAddressprepopulateDetails';


import returnStateFromCity from '@salesforce/apex/PI_AddressPopulateHelper.returnStateFromCity';
//import getObjectType from '@salesforce/apex/PI_AddressPopulateHelper.getObjectType';


//--------BELOW IS FOR PICKLIST--------/
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
//import state_City_Master_OBJECT from '@salesforce/schema/State_City_Master__c';   //GET OBJECT DESCRIPTION/SCHEMA
//import state_Type_FIELD from '@salesforce/schema/State_City_Master__c.State__c';  //GET PICKLIST VALUE

import contact_OBJECT from '@salesforce/schema/Contact';
import contact_address_Type_FIELD from '@salesforce/schema/Contact.Address_Type__c';  //GET PICKLIST VALUE
import address_OBJECT from '@salesforce/schema/Address';
import address_address_Type_FIELD from '@salesforce/schema/Address.AddressType';  //GET PICKLIST VALUE
import { ShowToastEvent } from 'lightning/platformShowToastEvent';//Show Toast on Success

const columns = [
    { label: 'Area Name', fieldName: 'Area__r', hideDefaultActions: true },
    { label: 'Postal Code', fieldName: 'Postal_Code__c', hideDefaultActions: true },
];



export default class Pi_AddressPopulate_LWCUpdate extends LightningElement {
    /*----------GET RECORD ID-------*/
    //@api objectApiName;

    //Reason:Relationship changed
    //LastModifed on: 08-Feb-2020
    //LastModifed By: Vivek S


    @api recordId;
    @api objectApiName;
    @api recId;
    /*
        //REGARDING THE PICKLIST
        @wire(getObjectInfo, { objectApiName: state_City_Master_OBJECT })
        stateCity_objectInfo;
        @wire(getPicklistValues, { recordTypeId: '$stateCity_objectInfo.data.defaultRecordTypeId', fieldApiName: state_Type_FIELD })
        state_PickList_Values;
        
    */
    //REGARDING AddressType  PICKLIST
    @wire(getObjectInfo, { objectApiName: contact_OBJECT })
    contact_objectInfo;

    @wire(getObjectInfo, { objectApiName: address_OBJECT })
    address_objectInfo;

    @wire(getPicklistValues, { recordTypeId: '$contact_objectInfo.data.defaultRecordTypeId', fieldApiName: contact_address_Type_FIELD })
    address_Type_PickList_Values;

    @wire(getPicklistValues, { recordTypeId: '$address_objectInfo.data.defaultRecordTypeId', fieldApiName: address_address_Type_FIELD })
    address_Type_PickList_Val;

    // @track PrivateAccountPickListValues = PickListValues;

    @api CardTitle;
    @api AddressDetails;

    //boolean variables
    isCitiesDisabled = false;
    isLoading = false;
    isStateDisabled = false;
    isPincodeDisabled = false;
    addressTypeAccount = false;
    addressTypeContact = false;
    PrivateaddressTypeAccount = false;
    //non-boolean variables
    @track mapOfJamMaster = [];
    @track listOfAreaMaster = [];
    @track PickListValues = [];


    cityOptions;

    cityValueSelected = '';
    stateValueFromArea = '';
    cityValueFromArea = '';
    defaultCountryValue = 'India';
    addressTypeValue = '';
    areaValue = '';
    StreetAutopopulate = '';
    addressTypeAutopopulate = '';

    @api defaultValueForCity;
    @api selectValue = '-Select-';



    @track columns = columns;
    connectedCallback() {
        // console.log('RecordId'+recordId);
        //this.getStateValues();
        // this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);
        this.addressTypeAccount = true;
        this.addressTypeContact = false;
        this.PrivateaddressTypeAccount = false;
        // To object Type
        /*  getObjectType({
              recordId: this.recId,
          })
          .then(result => {
              debugger;
          if(result === 'PUBLICACCOUNT'){
            this.addressTypeAccount = true;
            this.addressTypeContact = false;
            this.PrivateaddressTypeAccount = false;
          }else if(result === 'PRIVATEACCOUNT'){
             // { label: 'Billing', Value: 'Billing'},
            //  { label: 'Other', Value: 'Other'},
          //];
         // var picklist = [];
          this.PickListValues.push({ label : 'Billing' , value : 'Billing'});
          this.PickListValues.push({ label : 'Other' , value : 'Other'});
          this.PickListValues.push({ label : 'Mailing' , value : 'Mailing'});
            this.PrivateaddressTypeAccount = true;
            this.addressTypeAccount = false;
            this.addressTypeContact = false;
          }
          else{
              this.PrivateaddressTypeAccount = false;
              this.addressTypeContact = true;
              this.addressTypeAccount = false;
              
          }
        })
        .catch(error => {});
  
  */
        ////this.updateAddressssOnRecordHelper(this.recordId);
        // This is for setting default address onOnload
        /*getAddressDetails({recordId: this.recordId})
          .then(result => {
              this.AddressDetails = result;
              this.postalCode = this.AddressDetails.PostalCode;
              this.stateValueFromArea = this.AddressDetails.State;
              //this.defaultCountryValue = this.AddressDetails.Country;
              this.defaultValueForCity = this.AddressDetails.City;
             //// this.defaultAreaValue =  this.AddressDetails.Area;
              //this.cityValueFromArea = this.AddressDetails.City;
              this.StreetAutopopulate = this.AddressDetails.Street;
              this.addressTypeAutopopulate = this.AddressDetails.AddressType;
          })
          .catch(error => {});*/

    }


    //STATE PICKLIST
    handleStatePicklistChange = async (event) => {
        let selectedStateValue = event.detail.value;
        this.isLoading = true;
        this.returnCitiesHelper(selectedStateValue);

    }

    returnCitiesHelper = async (selectedStateValue, event) => {
        await returnCities({ stateName: selectedStateValue }).then(result => {
            if (result != null && result != undefined) {
                //console.log('>>' + JSON.stringify(result));
                this.isLoading = false;
                var res = result;
                let optionsValues = [];
                if (res.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        optionsValues.push({
                            label: result[i].Name,
                            value: result[i].Name
                        })
                    }
                    this.cityOptions = optionsValues;
                    this.isCitiesDisabled = false;
                } else {
                    this.cityOptions = null;
                    this.isCitiesDisabled = true;
                }
            }
        }).catch(error => {
            this.error = error;
            this.isLoading = false;
        })
    }

    //CITY PICKLIST
    handleCityPicklistChange = async (event) => {
        let selectedStateValue = event.detail.value;
        this.cityValueSelected = event.detail.value;
    }

    onStateSelection = async (event) => {
        var stateName = event.detail.selectedValue;
        var stateId = event.detail.selectedRecordId;
        this.selectedStateValue = stateName;
        console.log('state::' + stateName);
        console.log('state::' + stateId);
        //WHEN STATE IS REMOVED SET ALL TO NULL
        if (stateName == null || stateName == undefined) {
            this.cityValueSelected = null;
        } else {
            this.returnCitiesHelper(stateName);
            this.defaultValueForCity = null;
        }
    }

    onCitySelection = async (event) => {
        this.isLoading = true;
        let cityName = event.detail.selectedValue;
        var cityId = event.detail.selectedRecordId;
        if (cityId != undefined && cityId != null) {
            this.cityValueSelected = event.detail.selectedValue;
            await returnStateFromCity({ cityId: cityId }).then(result => {
                this.isLoading = false;
                if (result != null && result != undefined) {
                    if (result[0].State__c != null) {
                        this.stateValueFromArea = result[0].State__r.Name;
                    }
                }
            }).catch(error => {
                this.error = error;
                this.isLoading = false;
            })
        } else {
            this.isLoading = false;
            this.areaValue = null;
            this.areaNameId = null;
            this.stateValueFromArea = null;
            this.cityValueSelected = null;
        }

    }

    areaNameId = ''
    onAreaSelection = async (event) => {
        var areaName = event.detail.selectedValue;
        var areaId = event.detail.selectedRecordId;
        //console.log('Name::' + event.detail.selectedValue);
        //console.log('Id::' + event.detail.selectedRecordId);
        if (areaName != null && areaId != null) {
            await returnAreaAndPincode({ areaId: areaId, pinCode: null }).then(result => {
                if (result != null && result != undefined) {
                    if (result.length > 0) {
                        this.listOfAreaMaster = result;
                        this.hasMultiplePinCodes = false;
                        this.isStateDisabled = true;    //disable state picklist
                        this.isPincodeDisabled = true;//disable pincode
                        let res = result;
                        if (res != undefined) {
                            for (let i = 0; i < this.listOfAreaMaster.length; i++) {
                                this.stateValueFromArea = this.listOfAreaMaster[i].State__r.Name;
                                this.areaValue = this.listOfAreaMaster[i].Name;
                                this.areaNameId = this.listOfAreaMaster[i].Id;
                                if (this.listOfAreaMaster[i].City__r.Name != undefined) {
                                    this.cityValueFromArea = this.listOfAreaMaster[i].City__r.Name;
                                    this.isCitiesDisabled = true;
                                    this.defaultValueForCity = this.listOfAreaMaster[i].City__r.Name;
                                    this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                                }
                            }
                        }
                    }
                }
            }).catch(error => {
                this.error = error;
                this.isLoading = false;
            })
        } else {
            this.isStateDisabled = false;
            this.isCitiesDisabled = false;
            this.isPincodeDisabled = false;
            this.cityValueFromArea = null;
            this.postalCode = null;
            //this.defaultValueForCity = this.selectValue;
            //this.stateValueFromArea = this.selectValue;
            this.areaValue = null;
            this.areaNameId = null;
            this.isLoading = false;
            this.stateValueFromArea = null;//added on28-03-2021
            this.defaultValueForCity = null;//added on28-03-2021
            this.cityValueSelected = null;//added on28-03-2021
            this.selectedStateValue = null;
        }
    }

    hasMultiplePinCodes = false;
    @track data;
    searchPinCodeHandler = async (event) => {
        this.isLoading = true;
        var inputFields = this.template.querySelectorAll("lightning-input");
        var pincodeVar = '';
        inputFields.forEach(function (element) {
            if (element.name == "searchPincode") {
                pincodeVar = element.value;
                //   console.log(pincodeVar.toString().length);
            }
        }, this);
        if (pincodeVar.toString().length == 6) {
            await returnAreaAndPincode({ areaId: null, pinCode: pincodeVar }).then(result => {
                if (result != null && result != undefined) {
                    this.isLoading = false;
                    //console.log('-->' + JSON.stringify(result));
                    if (result.length > 0) {
                        this.hasMultiplePinCodes = true;
                        this.data = result;
                        this.listOfAreaMaster = result;
                    } else {
                        this.hasMultiplePinCodes = true;
                        this.data = null;
                    }
                } else {
                    this.data = null;
                }
            }).catch(error => {
                this.error = error;
                this.isLoading = false;
            })
        } else {
            this.isLoading = false;
        }
    }



    fillAddressBasedOnPincodeClick = async (event) => {
        this.hasMultiplePinCodes = false;
        var areaMasterId = event.target.dataset.id;
        var areaName = '';
        //console.log('pincode::' + this.listOfAreaMaster);
        for (let i = 0; i < this.listOfAreaMaster.length; i++) {
            if (areaMasterId == this.listOfAreaMaster[i].Id) {
                this.cityValueFromArea = this.listOfAreaMaster[i].City__r.Name;
                this.isCitiesDisabled = true;
                this.defaultValueForCity = this.listOfAreaMaster[i].City__r.Name;
                this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                this.stateValueFromArea = this.listOfAreaMaster[i].State__r.Name;
                areaName = this.listOfAreaMaster[i].Name;
            }
        }
        //note: check if this custom event is required to make a call
        const custEvent = new CustomEvent(
            'callparent', {
            detail: event.target.value
        });
        this.dispatchEvent(custEvent);
        //triggering action via this below call
        this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);

    }
    closeMultiplePinCodeRecordModal() {
        this.hasMultiplePinCodes = false;
    }
    handleAddressTypeChange(event) {
        this.addressTypeValue = event.detail.value;
        // this.updateAddressssOnRecordHelperPrePop(this.recId);
    }
    @track addressInfo = [];
    streetDetails = '';
    landmarkDetails = '';
    saveAddressOnClick() {
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            }
            if (element.name == "inputLandmark") {
                this.landmarkDetails = element.value;
            }
        }, this);
        // let isAddressEnteredBoolean = false;
        /*
        //address type can be null
        if ((this.streetDetails != null && this.streetDetails != undefined && this.streetDetails != "") && (this.areaNameId != null && this.areaNameId != undefined) && (this.cityValueFromArea != null && this.cityValueFromArea != undefined) && (this.stateValueFromArea != null && this.stateValueFromArea != undefined) && (this.postalCode != null && this.postalCode != undefined) && (this.defaultCountryValue != null && this.defaultCountryValue != undefined) && (this.addressTypeValue != null && this.addressTypeValue != undefined && this.addressTypeValue != "")) {
        */    // isAddressEnteredBoolean = true;
        if ((this.streetDetails != null && this.streetDetails != undefined && this.streetDetails != "") && (this.areaNameId != null && this.areaNameId != undefined) && (this.cityValueFromArea != null && this.cityValueFromArea != undefined) && (this.stateValueFromArea != null && this.stateValueFromArea != undefined) && (this.postalCode != null && this.postalCode != undefined) && (this.defaultCountryValue != null && this.defaultCountryValue != undefined)) {
            //console.log('objName::' + this.objectApiName);
            //console.log('objName::' + this.recordId);
            if (this.objectApiName == 'Address' && (this.recId == null || this.recId == undefined)) {
                this.getFiredFromAura(this.recordId);
            } else {
                this.getFiredFromAura(this.recId);
            }
        } else {
            //isAddressEnteredBoolean = false;
            // alert('Address is incomplete');
            const toastEvnt = new ShowToastEvent({
                title: 'Address is incomplete',
                message: 'Please fill the Address fields',
                variant: 'warning',
                mode: 'dismissable'
            });
            this.dispatchEvent(toastEvnt);
        }
    }

    @api isAddrComplete = false;
    //method to validate address 
    @api addressValidate(event) {
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            }
            if (element.name == "inputLandmark") {
                this.landmarkDetails = element.value;
            }
        }, this);

        let isAddressEnteredBoolean = false;
        debugger;
        if ((this.streetDetails != null && this.streetDetails != undefined) && (this.areaNameId != null && this.areaNameId != undefined) && (this.cityValueFromArea != null && this.cityValueFromArea != undefined) && (this.stateValueFromArea != null && this.stateValueFromArea != undefined) && (this.postalCode != null && this.postalCode != undefined) && (this.defaultCountryValue != null && this.defaultCountryValue != undefined)) {
            isAddressEnteredBoolean = true;
        } else {

            isAddressEnteredBoolean = false;
            // alert('Address is incomplete');
            const toastEvnt = new ShowToastEvent({
                title: 'Address is incomplete',
                message: 'Please fill the Address fields',
                variant: 'warning',
                mode: 'dismissable'
            });
            this.dispatchEvent(toastEvnt);
        }

        const validationCheckEvent = new CustomEvent("isAddressComplete", {
            detail: { isAddressEnteredBoolean }
        });
        // Fire the custom event
        this.dispatchEvent(validationCheckEvent);
        this.isAddrComplete = isAddressEnteredBoolean;
    }

    //method to updateAddress on respective record
    getFiredFromAura(recId, event) {
        this.addressInfo.push({
            streetInfo: this.streetDetails, areaInfo: this.areaNameId, cityInfo: this.cityValueFromArea,
            stateInfo: this.stateValueFromArea, postalCodeInfo: this.postalCode,
            countryInfo: this.defaultCountryValue, addressType: this.addressTypeValue, landMarkInfo: this.landmarkDetails
        });
        this.updateAddressOnRecordHelper(recId);
    }


    updateAddressOnRecordHelper = async (recId, event) => {
        await updatesObjectAddress({ recId: recId, completeAddressInfo: JSON.stringify(this.addressInfo) }).then(result => {
            if (result != null && result != undefined) {
                console.log('>>' + JSON.stringify(result));
                if (result == true) {
                    this.addressInfo = null;
                    this.addressInfo = [];

                    const toastEvnt = new ShowToastEvent({
                        title: 'Success',
                        message: 'Address has been Updated',
                        variant: 'Success',
                        mode: 'dismissable'
                    });
                    this.dispatchEvent(toastEvnt);
                    //eval("$A.get().fire('e.force:refreshView');");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1800);
                }
            }
        }).catch(error => {
            var errors = error;
            let errMsg;
            if (errors != null && errors.body != null) {
                errMsg = errors.body.message;
                const toastEvnt = new ShowToastEvent({
                    title: 'Error',
                    message: errMsg,
                    variant: 'error',
                    mode: 'dismissable'
                });
                this.dispatchEvent(toastEvnt);
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }
        })
    }
    @api getFiredFromAuraAdddressdetailsPrepopulate(recId, State, City, Area, AreaId, PostalCode) {
        debugger;
        console.log('recordId' + recId);
        console.log('State' + State);
        console.log('City' + City);
        console.log('Area' + Area);
        console.log('AreaId' + AreaId);
        console.log('PostalCode' + PostalCode);

        this.postalCode = PostalCode;
        this.stateValueFromArea = State;
        //sthis.defaultCountryValue = this.AddressDetails.Country;
        //this.defaultAreaValue =  this.AddressDetails.Area;
        this.cityValueFromArea = City;
        this.defaultValueForCity = City;
        var areaName = Area;
        var areaMasterId = AreaId;
        console.log('areaNameareaName' + areaName);
        console.log('areaMasterId' + areaMasterId);
        this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
        //  this.updateAddressssOnRecordHelper(recordId);
    }
    @api getFiredFromAuraAdddressdetails(recordId) {
        debugger;
        // this.updateAddressssOnRecordHelper(recordId);
    }

    updateAddressssOnRecordHelper = async (recId, event) => {
        debugger;
        await getAddressDetails({ recordId: recId }).then(result => {
            if (result != null && result != undefined) {
                debugger;
                this.AddressDetails = result;
                this.postalCode = this.AddressDetails.PostalCode;
                this.stateValueFromArea = this.AddressDetails.State;
                //sthis.defaultCountryValue = this.AddressDetails.Country;
                //this.defaultAreaValue =  this.AddressDetails.Area;
                this.cityValueFromArea = this.AddressDetails.City;
                this.defaultValueForCity = this.AddressDetails.City;
                this.StreetAutopopulate = this.AddressDetails.Street;
                this.addressTypeAutopopulate = this.AddressDetails.AddressType;
                console.log('Test this.AddressDetails.City' + this.AddressDetails.City);
                var areaName = this.AddressDetails.Area;
                var areaMasterId = this.AddressDetails.AreaId;
                console.log('areaNameareaName' + areaName);
                console.log('areaMasterId' + areaMasterId);
                this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
            }
        }).catch(error => {
            this.error = error;
        })
    }


    updateAddressssOnRecordHelperPrePop = async (recId, event) => {
        await getAddressprepopulateDetails({ recordId: recId, addType: this.addressTypeValue }).then(result => {
            if (result != null && result != undefined) {
                this.AddressDetails = result;
                this.postalCode = this.AddressDetails.PostalCode;
                this.stateValueFromArea = this.AddressDetails.State;
                //sthis.defaultCountryValue = this.AddressDetails.Country;
                //this.defaultAreaValue =  this.AddressDetails.Area;
                this.cityValueFromArea = this.AddressDetails.City;
                this.defaultValueForCity = this.AddressDetails.City;
                this.StreetAutopopulate = this.AddressDetails.Street;
                this.addressTypeAutopopulate = this.AddressDetails.AddressType;
                var areaName = this.AddressDetails.Area;
                var areaMasterId = this.AddressDetails.AreaId;
                console.log('areaNameareaName' + areaName);
                console.log('areaMasterId' + areaMasterId);
                this.template.querySelector('[data-id="pi_custom_LookupLWC"]').getFiredFromAura(areaName, areaMasterId);
            }
        }).catch(error => {
            this.error = error;
        })
    }

}