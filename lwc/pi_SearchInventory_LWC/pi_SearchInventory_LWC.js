import { LightningElement, track, wire, api } from "lwc";
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { loadScript, loadStyle } from 'lightning/platformResourceLoader';
import SWEETALERT from "@salesforce/resourceUrl/VME_SweetAlert";

import getLoggedInUserInfo from '@salesforce/apex/SearchInventoryController.getLoggedInUserInfo';

//added on 03-March-2021
import getPrdtInventoryDetialFromSAPHelper from '@salesforce/apex/SearchInventoryController.getPrdtInventoryDetialFromSAPHelper';
import checkForExistingOrdersOnAccount from '@salesforce/apex/SearchInventoryController.checkForExistingOrdersOnAccount';
import createOrders from '@salesforce/apex/SearchInventoryController.createOrders';
import createOrderProducts from '@salesforce/apex/SearchInventoryController.createOrderProducts';

import getAllRecordTypes from '@salesforce/apex/LightningRecordEditFormController.getAllRecordTypes';
import getPicklistValuesApex from '@salesforce/apex/Utility.getPicklistValues';


import search from '@salesforce/apex/SearchInventoryController.search';
import searchAlternatePartHelper from '@salesforce/apex/SearchInventoryController.searchAlternatePartHelper';
import searchAltSparePartBulkOnSAP from '@salesforce/apex/SearchInventoryController.searchAltSparePartBulkOnSAP';

import userID from '@salesforce/user/Id';

export default class Pi_SearchInventory_LWC extends LightningElement {

    @track columns = [{
        label: 'Product name',
        fieldName: 'prdtName',
        type: 'text',
        hideDefaultActions: true,
        wrapText: true,
    }, {
        label: 'Material No',
        fieldName: 'prdtMaterialNo',
        type: 'text',
        hideDefaultActions: true
    }, {
        label: 'Available in Inventory',
        fieldName: 'hasProductInWareHouse',
        type: 'boolean',
        hideDefaultActions: true
    }, {
        label: 'Quantity',
        fieldName: 'quantity',
        type: 'text',
        hideDefaultActions: true
    }, {
        type: "button", typeAttributes: {
            label: 'Search',
            name: 'search',
            title: 'search',
            disabled: false,
            value: 'Search',
            iconPosition: 'center'
        }
    }
    ];

    @api recordId;
    @api objectApiName;
    @api cardTitle = '';

    user_Id = userID;
    isProductNotAvailable = false;
    enablePrdtRequestBtn = true;    //show/hide product request btn

    availableQuantity = '';
    loggedInUserProfileName;//contains user profile name

    accountRecId = null;
    workOrderRecId = null;
    connectedCallback() {
        //load of existing orders commented on 15-march-2021
        /*
           if (this.objectApiName == 'Account') {
               this.getRecordTypeHelper();
               this.accountRecId = this.recordId;
           } else {
               this.selectedProductRecordType = true;   //show the order page
               this.workOrderRecId = this.recordId;
           }
   
           this.getPicklistValueHelper();
           this.loadProductRequestHelper();    //load product request
           this.getUserProfileInfo();
   */
        setTimeout(() => {
            this.isLoading = false;
        }, 1000);

    }

    todayInfo;
    getUserProfileInfo = async (event) => {
        await getLoggedInUserInfo({ usrId: this.user_Id }).then(result => {
            if (result != null && result != undefined) {
                if (result.UserObj.Profile.Name == 'Community Contractor') {
                    this.showProductRequestDetails = true;  //ONLY IF THE USER IS COMMUNITY CONTRACTOR IT SHOULD DISPLAY THE TABLE
                    //NOTE: CURRENTLY IT IS BEING SET TO TRUE IN 'loadProductRequestHelper' METHOD FOR TESTING PURPORSE
                    this.loggedInUserProfileName = result.UserObj.Profile.Name;
                }
                this.todayInfo = new Date(result.todayInfo);
            }
        }).catch(error => {
            this.error = error;
        })
    }

    prdtReqRecordTypeOptions = [];
    //get Product Request RecordTypes
    getRecordTypeHelper = async (event) => {
        await getAllRecordTypes({ objName: 'Order' }).then(result => {
            if (result != null && result != undefined) {
                var res = result;
                let optionsValues = [];
                if (res.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        optionsValues.push({
                            label: result[i].name,
                            value: result[i].typeId
                        })
                    }
                    this.prdtReqRecordTypeOptions = optionsValues;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }
    selectedProductRecordType = '';
    selectedOrderRecordType = null;
    //handle record type selection
    handleRecordTypeSelection(event) {
        this.selectedOrderRecordType = event.detail.value;
        this.selectedProductRecordType = true;
    }


    getPicklistValueHelper = async (event) => {
        await getPicklistValuesApex({ ObjectApi_name: 'ProductRequest', Field_name: 'ShipmentType' }).then(result => {
            if (result != null && result != undefined) {
                var res = result;
                let optionsValues = [];
                if (res.length > 0) {
                    for (let i = 0; i < result.length; i++) {
                        optionsValues.push({
                            label: result[i],
                            value: result[i]
                        })
                    }
                    this.shipment_Type_PickList_Values = optionsValues;
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }
    selectedProductId = '';
    destinationId = '';  //destination where product is available 

    tat_Value;

    //added on 03-March-2021
    @track mapData = [];
    locationResultWrapper;
    getInventoryDetailsFromSAPHandler = async (prdtId, event) => {
        this.enableSpinner();
        if (prdtId != null && prdtId != undefined && prdtId.length > 0) {
            this.isProductNotAvailable = false;
            await getPrdtInventoryDetialFromSAPHelper({ productItemId: prdtId, workOrderId: null }).then(result => {
                var res = result;
                if (result != null && result != undefined && res.length > 0) {
                    this.disableSpinner();
                    this.locationResultWrapper = result;
                    this.availableQuantity = '10';
                    /*var conts = result.locationMap;
                    console.log('>>' + JSON.stringify(result));
                    for (var key in conts) {
                        this.mapData.push({ value: conts[key], key: key }); //Here we are creating the array to show on UI.
                    }*/
                    this.isProductNotAvailable = false;
                } else {
                    this.isProductNotAvailable = true;
                    this.isLoading = false;
                }
            }).catch(error => {
                this.disableSpinner();
                this.error = error;
            })
        }
    }


    enableSpinner() {
        this.isLoading = true;
    }
    disableSpinner() {
        this.isLoading = false;
    }

    //SHOW INVENTORY DETAILS SECTION
    enableDisableInventorySection(trueFalse) {
        if (trueFalse == false) {
            this.availableQuantity = '';
            this.selectedProductId = '';
        }
    }

    //INCREMENT HELPER STARTS
    @api counterValue = 1;
    @api incrementValue = 1;
    @api label = 'Enter Quantity'

    handleDecrement(event) {
        this.counterValue = parseInt(this.counterValue) - parseInt(this.incrementValue);
    }
    handleIncrement(event) {
        this.counterValue = parseInt(this.counterValue) + parseInt(this.incrementValue);
    }



    //PRODUCT REQUEST MODAL STARTS
    isRequestPartBoolean = false;
    openRequestBtnClick() {
        this.openCloseRequestModalHelper(true);
    }
    closeRequestBtnClick() {
        this.openCloseRequestModalHelper(false);
    }

    //OPEN CLOSE PRODUCT REQUEST MODAL
    openCloseRequestModalHelper(trueFalse) {
        this.isRequestPartBoolean = trueFalse;
        if (trueFalse == false) {
            //this.selectedProductRecordType = null;
            this.selectedOrderRecordType = null;

            this.counterValue = 1;
        }
    }

    showProductReqLinkModal = false;
    selectedNeedByDate;
    selectedShipmentType;
    handleSumbitProductRequest = async (event) => {
        //let selectedShipmentType = '';// let selectedNeedByDate = '';
        var inp = this.template.querySelectorAll("lightning-input");
        inp.forEach(function (element) {
            if (element.name == "needByDateInput") {
                // console.log(element.value);
                this.selectedNeedByDate = element.value;
            }
        }, this);
        var inpCheckBox = this.template.querySelectorAll("lightning-combobox");
        inpCheckBox.forEach(function (element) {
            if (element.name == "shipmentType") {
                this.selectedShipmentType = element.value;
            }
        }, this);
        let checkValidtion = true;

        //END DATE SHOULD BE GREATER THAN TODAY
        if (new Date(this.selectedNeedByDate) < this.todayInfo) {
            checkValidtion = false;
            alert('End date must be greater than today');
        }
        //REQUIRED VALUE CANNOT BE GREATER THAN AVAILABLE
        if (this.counterValue > this.availableQuantity) {
            checkValidtion = false;
            alert('Product Quantity you are trying to request is invalid.');
        }
        if (checkValidtion == true) {
            this.isRequestPartBoolean = false;
            Swal.fire({
                title: 'Create Product Request?',
                text: 'Do you want to create a new Product Request or Link to Exisitng Product Request ?',
                type: 'error',
                showCancelButton: true,
                confirmButtonColor: 'orangered',
                confirmButtonText: 'Create New',
                cancelButtonText: 'Link to Exisitng!',
                cancelButtonColor: '#22bb33',
                footer: null,
            }).then((result) => {
                if (result.value) {
                    //CREATE NEW PRODUCT REQUEST
                    this.createProductRequestHandler();
                }
                else if (result.dismiss == 'cancel') {
                    //LINK TO EXISTING PRODUCT REQUEST
                    this.showProductReqLinkModal = true;
                    //logic to link we request with record
                }
            })
        }
    }

    //HANDLER TO CREATE NEW PRODUCT REQUEST
    createProductRequestHandler = async (event) => {
        await createOrders({ orderRecordTypeId: this.selectedOrderRecordType, accountId: this.accountRecId, workOrderObjId: this.workOrderRecId, shipmentType: this.selectedShipmentType, needByDate: this.selectedNeedByDate, reqQuantity: this.counterValue, productId: this.selectedProductId, expected_TAT: this.tat_Value }).then(result => {
            if (result != null && result != undefined) {
                var res = result;
                this.openCloseRequestModalHelper(false);    //close the modal 
                this.swalHelper('Record saved!!', 'Product Request Created', 'success', null);
                this.loadProductRequestHelper();    //GET NEWLY CREATED PRODUCT REQUESTS
                //  this.showNotification('Successful', 'Product Request Created', 'success');  //showToast
                this.resetAttributesAfterSave();    //reset all the attributes after save.
            } else {

            }
        }).catch(error => {
            this.error = error;
        })
    }

    allProductDetials;
    showProductRequestDetails = false;
    //load all product request details
    loadProductRequestHelper = async (event) => {
        this.enableSpinner();
        //added on 04-March-2021
        await checkForExistingOrdersOnAccount({ recordId: this.recordId }).then(result => {
            if (result != null && result != undefined) {
                this.disableSpinner();
                var res = result;
                if (result != null && res != null) {
                    this.allProductDetials = result;
                    this.showProductRequestDetails = true;
                } else {
                    this.isLoading = false;
                }
            } else {
                this.disableSpinner();
            }
        }).catch(error => {
            this.error = error;
        })
    }



    //open record
    openProductReqLineItemHandler(event) {
        var rec_Id = event.target.dataset.targetId
        window.open('/' + rec_Id, '_blank');
    }

    closeProductReqLinkBtnClick() {
        this.showProductReqLinkModal = false;
    }



    //ask whether to create new or Link
    checkToCreateNewProductOrLink() {
        Swal.fire({
            title: 'Create Product Request?',
            text: 'Do you want to create a new Product Request or Link to Exisitng Product Request ?',
            type: 'error',
            showCancelButton: true,
            confirmButtonColor: 'orangered',
            confirmButtonText: 'Create New',
            cancelButtonText: 'Link to Exisitng!',
            cancelButtonColor: '#22bb33',
            footer: null,
        }).then((result) => {
            if (result.value) {
            }
            else if (result.dismiss == 'cancel') {
                //console.log('dont delete');
            }
        })
    }
    //submit for approval
    submitForApprovalHandler(event) {
        //console.log('id::' + event.target.dataset.targetId);
    }


    addNewLineItemToProductHandler = async (event) => {
        let orderIdVar = event.target.dataset.targetId;

        await createOrderProducts({ orderId: orderIdVar, productId: this.selectedProductId, reqQuantity: this.counterValue }).then(result => {
            if (result != null && result != undefined) {
                var res = result;
                if (res.Id != null && res.Id != undefined) {
                    this.swalHelper('Record saved!!', 'Product Request Line Item Created', 'success', null);
                    this.loadProductRequestHelper();    //GET NEWLY CREATED PRODUCT REQUESTS
                    this.closeProductReqLinkBtnClick();
                    this.resetAttributesAfterSave();
                }
            }
        }).catch(error => {
            this.error = error;
        })
    }

    //reset values to null
    resetAttributesAfterSave() {
        // this.selectedProductId = '';
        this.counterValue = 1;
        this.selectedNeedByDate = null;
        this.selectedShipmentType = null;
        // this.selectedProductRecordType = null;
        if (this.objectApiName == 'Account') {
            this.selectedProductRecordType = false;
            //this.selectedOrderRecordType = false;
        }

        this.tat_Value = null;
    }


    showNotification(title, msg, variant) {
        const evt = new ShowToastEvent({
            title: title,
            message: msg,
            variant: variant,
        });
        this.dispatchEvent(evt);
    }

    /*------------LOAD SCRIPT FOR SWAL-----------------*/
    renderedCallback() {
        Promise.all([loadScript(this, SWEETALERT)]).then(() => { }).catch(
            error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error loading D3',
                    message: error.message,
                    variant: 'error'
                }));
            });
    }
    /*------------SWAL HELPER------------*/
    swalHelper(title, text, type, footer) {
        Swal.fire({
            title: title,
            text: text,
            type: type,
            footer: footer
        })
    }
    handleDateSelection(event) {
        var selectedDate = event.detail.value;
        selectedDate = new Date(selectedDate);

        if (selectedDate < this.todayInfo) {
            alert('End date must be greater than today');
        }
    }
    //send today's date in wrapper for date validation



    async handleSearch(event) {
        const lookupElement = event.target;
        const parentField = event.target.getAttribute("data-parent-field-name");
        const parentValue = event.target.getAttribute("data-parent-value");
        const condition = (parentField && parentValue && parentValue !== "undefined") ? `${parentField} = '${parentValue}'` : null;

        const options = await search({
            condition,
            keyword: event.detail.searchTerm,
            objectName: event.target.getAttribute("data-object-name")
        });
        lookupElement.setSearchResults(options);
    }


    handleProductSelect(event) {
        this.selectedProductId = event.detail.length ? event.detail[0].id : null;
        if (this.selectedProductId != null) {
            this.isLoading = true;
            this.getInventoryDetailsFromSAPHandler(this.selectedProductId);  //added on 03-March-2021

        } else {
            this.locationResultWrapper = null;
            this.isProductNotAvailable = false;
        }
    }

    @track showAlternateData;
    enableAlternatePartPopup = false;
    checkAlternatePartBtn = async (event) => {
        this.enableSpinner();

        await searchAlternatePartHelper({ productId: this.selectedProductId, accountId: this.recordId }).then(result => {
            if (result != null && result != undefined) {
                this.disableSpinner();
                this.enableDisableAlternatePartHelper(true);
                var res = result;
                if (result.length > 0) {
                    this.showAlternateData = result;
                }
            } else {
                this.disableSpinner();
                this.enableDisableAlternatePartHelper(true);
                this.showAlternateData = null;
                //  this.showToast("Error", 'Alternate Part does not exist', "error");
            }
        }).catch(error => {
            this.error = error;
            this.showToast("Error", error.body.message, "error");
        })
    }

    enableDisableAlternatePartHelper(openClose) {
        this.enableAlternatePartPopup = openClose;
    }

    closeAlternatePart() {
        this.enableDisableAlternatePartHelper(false);
    }

    callRowAction(event) {
        const searchPrdtId = event.detail.row.productId;
        const prdtQuantity = event.detail.row.quantity;
        const actionName = event.detail.action.name;
        if (actionName === 'search') {
            if (prdtQuantity != undefined && prdtQuantity > 0) {
                this.showToast("Error", "The part you're trying search already exist in your inventory.", "error");
            } else {
                this.closeAlternatePart();//close alternate DataTable
                this.getInventoryDetailsFromSAPHandler(searchPrdtId); //SEARCH PRODUCT //added on 03-March-2021
            }
        }
    }


    selectedRows = [];
    selectedRowHandler(event) {
        const selRows = event.detail.selectedRows;
        if (this.selectedRows.length < selRows.length) {
        } else {
            let deselectedRecs = this.selectedRows
                .filter(x => !selRows.includes(x))
                .concat(selRows.filter(x => !this.selectedRows.includes(x)));
            if (this.selectedProductsIds != null && this.selectedProductsIds.length > 0) {
                for (let i = 0; i < this.selectedProductsIds.length; i++) {
                    for (let j = 0; j < deselectedRecs.length; j++) {
                        if (deselectedRecs[j].productId === this.selectedProductsIds[i]) {
                            this.selectedProductsIds.splice(i, 1);
                        }
                    }
                }
            }
        }
        this.selectedRows = selRows;
    }

    selectedProductsIds = [];
    searchAlternatePartBulkBtn() {
        this.selectedProductsIds = [];//in  italizing to null during every search
        if (this.selectedRows.length == 0) {
            this.showToast("Info", "Please select atleast one part to search.", "info");
        } else {
            for (let i = 0; i < this.selectedRows.length; i++) {
                if (this.selectedRows[i].hasProductInWareHouse == true) {
                    this.showToast("Error", "The part you're trying search already exist in your inventory.", "error");
                    break;
                } else {
                    if (!this.selectedProductsIds.includes(this.selectedRows[i].productId)) {
                        this.selectedProductsIds.push(this.selectedRows[i].productId);
                    }
                }
            }
            if (this.selectedProductsIds.length > 0) {
                this.searchAltSparePartOnBulkHelper();
            }

        }
    }

    searchAltSparePartOnBulkHelper = async (event) => {
        
        await searchAltSparePartBulkOnSAP({ altProductIds: this.selectedProductsIds }).then(result => {
            if (result != null && result != undefined) {
                this.disableSpinner();
                this.locationResultWrapper = result;
                this.isProductNotAvailable = false;
            } else {
                //this.isProductNotAvailable = true;
                //this.closeAlternatePart();//close alternate DataTable
                this.showToast("Info", 'No results found!', "info");
            }
        }).catch(error => {
            this.error = error;
            this.showToast("Error", error.body.message, "error");
        })
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
    }
}