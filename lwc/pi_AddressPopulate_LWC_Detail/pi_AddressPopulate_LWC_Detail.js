import { LightningElement, track, wire, api } from "lwc";
//Reason:Relationship changed
//LastModifed on: 08-Feb-2020
//LastModifed By: Vivek S


import getStateNames from '@salesforce/apex/PI_AddressPopulateHelper.getStateNames';
import returnCities from '@salesforce/apex/PI_AddressPopulateHelper.returnCities';
import returnAreaAndPincode from '@salesforce/apex/PI_AddressPopulateHelper.returnAreaAndPincode';
import updatesObjectAddress from '@salesforce/apex/PI_AddressPopulateHelper.updatesObjectAddress';
import getAddressDetails from '@salesforce/apex/PI_AddressPopulateHelper.getAddressDetails';
import getProductDetails from '@salesforce/apex/PI_AddressPopulateHelper.getProductDetails';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';//Show Toast on Success

//--------BELOW IS FOR PICKLIST--------/
import { getPicklistValues } from 'lightning/uiObjectInfoApi';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
//import state_City_Master_OBJECT from '@salesforce/schema/State_City_Master__c';   //GET OBJECT DESCRIPTION/SCHEMA
//import state_Type_FIELD from '@salesforce/schema/State_City_Master__c.State__c';  //GET PICKLIST VALUE

import contact_OBJECT from '@salesforce/schema/Contact';
import contact_address_Type_FIELD from '@salesforce/schema/Contact.Address_Type__c';  //GET PICKLIST VALUE

const columns = [
    { label: 'Area Name', fieldName: 'Area__r', hideDefaultActions: true },
    { label: 'Postal Code', fieldName: 'Postal_Code__c', hideDefaultActions: true },
];

export default class Pi_AddressPopulate_LWC extends LightningElement {
    /*----------GET RECORD ID-------*/
    //@api objectApiName;

    //Reason:Relationship changed
    //LastModifed on: 08-Feb-2020
    //LastModifed By: Vivek S


    @api recordId;
    @api objectApiName;
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

    @wire(getPicklistValues, { recordTypeId: '$contact_objectInfo.data.defaultRecordTypeId', fieldApiName: contact_address_Type_FIELD })
    address_Type_PickList_Values;

    @api CardTitle;
    @api AddressDetails;

    //boolean variables
    isCitiesDisabled = false;
    isLoading = false;
    isStateDisabled = false;
    isPincodeDisabled = false;
    //non-boolean variables
    @track mapOfJamMaster = [];
    @track listOfAreaMaster = [];

    cityOptions;

    cityValueSelected = '';
    stateValueFromArea = '';
    cityValueFromArea = '';
    defaultCountryValue = 'India';
    addressTypeValue = '';
    areaValue = '';
    defaultAreaValue = '';
    StreetAutopopulate = '';
    addressTypeAutopopulate = '';
    LandMarkAutopopulate = '';
    @api defaultValueForCity = ''
    @api selectValue = '';


    //08-Feb-2020
    stateOptions;

    @track columns = columns;
    connectedCallback() {
        this.getStateValues();
        this.isLoading = true;
        setTimeout(() => {
            this.isLoading = false;
        }, 2000);

        if (this.objectApiName == 'WorkOrder') {
            getProductDetails({ recordId: this.recordId })
                .then(result => {
                    if (result == 'True') {
                        const toastEvnt = new ShowToastEvent({
                            title: 'This is a premium product',
                            message: 'This is a premium product',
                            variant: 'Success',
                            mode: 'dismissable'
                        });
                        this.dispatchEvent(toastEvnt);
                    }
                })
                .catch(error => { });
        }

        getAddressDetails({ recordId: this.recordId })
            .then(result => {
                this.AddressDetails = result;
                this.postalCode = this.AddressDetails.PostalCode;
                this.stateValueFromArea = this.AddressDetails.State;
                //this.defaultCountryValue = this.AddressDetails.Country;
                if (this.AddressDetails.City != undefined) {
                    this.defaultValueForCity = this.AddressDetails.City;
                }
                this.defaultAreaValue = this.AddressDetails.Area;
                //this.cityValueFromArea = this.AddressDetails.City;
                this.StreetAutopopulate = this.AddressDetails.Street;
                this.addressTypeAutopopulate = this.AddressDetails.AddressType;
                this.LandMarkAutopopulate = this.AddressDetails.Landmark;
                this.isStateDisabled = true;    //disable state picklist
                this.isPincodeDisabled = true;
                this.isCitiesDisabled = true;


            })
            .catch(error => { });
    }

    //08-Feb-2020
    getStateValues = async (event) => {
        this.isCitiesDisabled = true;
        this.isLoading = true;
        await getStateNames({}).then(result => {
            if (result != null && result != undefined) {
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
                    this.stateOptions = optionsValues;
                } else {
                    this.stateOptions = null;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }

    //STATE PICKLIST
    handleStatePicklistChange = async (event) => {
        let selectedStateValue = event.detail.value;
        this.isLoading = true;
        await returnCities({ stateName: selectedStateValue }).then(result => {
            if (result != null && result != undefined) {
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
        })
    }

    //CITY PICKLIST
    handleCityPicklistChange = async (event) => {
        let selectedStateValue = event.detail.value;
        this.cityValueSelected = event.detail.value;
    }

    areaNameId = ''
    onAreaSelection = async (event) => {
        var areaName = event.detail.selectedValue;
        var areaId = event.detail.selectedRecordId;
        console.log('Name::' + event.detail.selectedValue);
        console.log('Id::' + event.detail.selectedRecordId);
        if (areaName != null && areaId != null) {
            await returnAreaAndPincode({ areaId: areaId, pinCode: null }).then(result => {
                if (result != null && result != undefined) {
                    if (result.length > 0) {
                        this.listOfAreaMaster = result;
                        this.hasMultiplePinCodes = false;
                        this.isStateDisabled = true;    //disable state picklist
                        this.isPincodeDisabled = true;//disable pincode
                        let res = result;
                        console.log('returnAreaAndPincode::' + JSON.stringify(result));


                        if (res != undefined) {
                            for (let i = 0; i < this.listOfAreaMaster.length; i++) {
                                console.log('city name::' + JSON.stringify(this.listOfAreaMaster[i].City__r));
                                this.stateValueFromArea = this.listOfAreaMaster[i].State__r.Name;
                                this.areaValue = this.listOfAreaMaster[i].Name;
                                this.areaNameId = this.listOfAreaMaster[i].Id;
                                if (this.listOfAreaMaster[i].City__r.Name != undefined) {
                                    this.cityValueFromArea = this.listOfAreaMaster[i].City__r.Name;
                                    this.isCitiesDisabled = true;
                                    this.defaultValueForCity = this.listOfAreaMaster[i].City__r.Name;
                                    this.postalCode = this.listOfAreaMaster[i].Postal_Code__r.Name;
                                }
                                console.log('city name::' + JSON.stringify(this.listOfAreaMaster[i].City__r.Name));
                            }
                        }
                    }
                }
            }).catch(error => {
                this.error = error;
            })
        } else {
            this.isStateDisabled = false;
            this.isCitiesDisabled = false;
            this.isPincodeDisabled = false;
            this.cityValueFromArea = null;
            this.postalCode = null;
            this.defaultValueForCity = this.selectValue;
            this.stateValueFromArea = this.selectValue;
            this.areaValue = null;
            this.areaNameId = null
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
            }
        }, this);
        await returnAreaAndPincode({ areaId: null, pinCode: pincodeVar }).then(result => {
            if (result != null && result != undefined) {
                this.isLoading = false;
                console.log('-->' + JSON.stringify(result));
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
        })

    }
    fillAddressBasedOnPincodeClick = async (event) => {
        this.hasMultiplePinCodes = false;
        var areaMasterId = event.target.dataset.id;
        var areaName = '';
        console.log('::' + this.listOfAreaMaster);
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
    }
    @track addressInfo = [];
    streetDetails = '';
    saveAddressOnClick() {


    }

    @api getFiredFromAura(recordId) {
        var inputFields = this.template.querySelectorAll("lightning-textarea");
        inputFields.forEach(function (element) {
            if (element.name == "streetAddress") {
                this.streetDetails = element.value;
            }
        }, this);
        this.addressInfo.push({
            streetInfo: this.streetDetails, areaInfo: this.areaNameId, cityInfo: this.cityValueFromArea,
            stateInfo: this.stateValueFromArea, postalCodeInfo: this.postalCode,
            countryInfo: this.defaultCountryValue, addressType: this.addressTypeValue
        });
        this.updateAddressOnRecordHelper(recordId);

    }
    updateAddressOnRecordHelper = async (recordId, event) => {
        console.log('recordId::' + recordId);
        console.log('address::' + this.addressInfo);
        await updatesObjectAddress({ recId: recordId, completeAddressInfo: JSON.stringify(this.addressInfo) }).then(result => {
            if (result != null && result != undefined) {
                if (result == true) {
                    this.addressInfo = null;
                    this.addressInfo = [];
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }


}