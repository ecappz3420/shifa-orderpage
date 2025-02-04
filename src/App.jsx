import { useRef } from "react";
import {
  Form,
  Input,
  Button,
  Modal,
  Select,
  InputNumber,
  message,
  Checkbox,
} from "antd";

import { CloseOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getRecords, postRecord } from "./api/zoho";
import Customer from "./components/Customer";
import dayjs from "dayjs";

const App = () => {
  const [form] = Form.useForm();
  const [formInitialValues, setFormInitialValues] = useState({});
  const [customers, setCustomers] = useState([]);
  const [salesPersons, setSalesPersons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [openCustomer, setOpenCustomer] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [salesExecutives, setSalesExecutives] = useState([]);
  const [typedNewCustomerValue, setTypedNewCustomerValue] = useState("");
  const [modalResetTrigger, setModalResetTrigger] = useState(0);

  const addLineItemBtnRef = useRef(null);
  const customerNameFieldRef = useRef(null);

  const onSubmit = async (data) => {
    setLoading(true);
    messageApi.open({ type: "loading", content: "Adding Record..." });
    const formData = {
      ...data,
      Order_Date: dayjs().format("DD-MMM-YYYY"),
      Customer: customers.find((i) => i.value === data.Customer)?.id || "",
      Branch: branches.find((i) => i.value === data.Branch)?.id || "",
      Sales_Person:
        salesPersons.find((i) => i.value === data.Sales_Person)?.id || "",
      Sales_Executive:
        salesExecutives.find((i) => i.value === data.Sales_Executive)?.id || "",
      Items:
        data.Items?.map((item) => ({
          Product: products.find((i) => i.value === item.Product)?.id || "",
          Quantity: item?.Quantity || 1,
          Description: item?.Description || "",
          Status: "260850000000014040",
        })) || "",
    };
    const finalData = {
      data: formData,
    };

    try {
      const response = await postRecord("Sales_Order", finalData);
      const result = response;
      console.log(result);
      form.resetFields();
      messageApi.destroy();
      messageApi.success({ content: "Order Created!" });
      console.log("Submitted Data: ", finalData);
    } catch (error) {
      messageApi.error("Error Adding Record");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalClose = () => {
    setOpenCustomer(false);
  };

  const addNewCustomer = (data) => {
    setCustomers((prev) => [...prev, data]);
    form.setFieldsValue({ Customer: data.value });
  };

  useEffect(() => {
    const init = async () => {
      form.setFieldsValue({
        Home_Delivery: false,
        Due_Products: false,
        Confirm_with_Customers: false,
      });
      try {
        const customerResp = await getRecords("All_Customers", "ID != 0");
        const customer_data = customerResp.map((record) => ({
          label: record.Phone_Number + " - " + record.Customer_Name,
          value: record.Phone_Number,
          id: record.ID,
          key: record.ID,
        }));
        setCustomers(customer_data);
        const salesResp = await getRecords("All_Users", "ID != 0");
        const sales_data = salesResp.map((record) => ({
          label: record.Name.display_value,
          value: record.Name.display_value,
          id: record.ID,
        }));
        setSalesPersons(sales_data);
        const branchResp = await getRecords("All_Branches", "ID != 0");
        const branch_data = branchResp.map((record) => ({
          label: record.Branch_Name,
          value: record.Branch_Name,
          id: record.ID,
        }));
        setBranches(branch_data);
        const initparams = await ZOHO.CREATOR.UTIL.getInitParams();
        const { loginUser } = initparams;
        if (salesResp.length > 0) {
          const user = salesResp.find((i) => i.Email === loginUser);
          if (user) {
            const fieldsValue = {
              Sales_Person: user.Name.display_value,
              Branch: user.Branch.display_value,
              Items: [
                {
                  Product: undefined,
                  Quantity: 1,
                  Description: "",
                },
              ],
            };
            form.setFieldsValue(fieldsValue);
            setFormInitialValues(fieldsValue);

            const sales_executives = salesResp.filter(
              (i) => i.Branch.ID === user.Branch.ID
            );
            setSalesExecutives(() => {
              return sales_executives.map((record) => ({
                label: record.Name.display_value,
                value: record.Name.display_value,
                id: record.ID,
              }));
            });
          }
        }
        const productResp = await getRecords("All_Products", "ID != 0");
        const product_data = productResp.map((record) => ({
          label: record.Product_Name,
          value: record.Product_Name,
          id: record.ID,
          key: record.ID,
        }));
        setProducts(product_data);
      } catch (error) {
        console.log(error);
      }
    };
    init();
  }, []);

  const handleAddNewCustomerOnKeyDown = (event) => {
    if (event.key === "Enter") {
      if (typedNewCustomerValue) {
        if (typedNewCustomerValue !== "cleared") {
          const exists = customers.some(
            (opt) => opt.value === typedNewCustomerValue
          );
          if (!exists) {
            setModalResetTrigger((prev) => prev + 1);
            setOpenCustomer(true);
          }
        } else {
          const targetForm = event.target.form; // Get the form element
          const index = Array.prototype.indexOf.call(targetForm, event.target); // Get the current element's index
          if (targetForm[index + 3]) {
            targetForm[index + 3].focus(); // Focus the next element
          }
        }
      }
    }
  };

  const handleAddNewProductOnKeyDown = async (event, fieldName) => {
    if (event.key === "Enter")
      if (productSearch) {
        if (productSearch !== "cleared") {
          const exists = products.some((opt) => opt.value === productSearch);
          if (!exists) {
            try {
              const response = await postRecord("Product", {
                data: {
                  Product_Name: productSearch,
                },
              });
              const newProduct = {
                label: productSearch,
                value: productSearch,
                id: response.ID,
                key: response.ID,
              };
              setProducts((prev) => [...prev, newProduct]);

              form.setFieldsValue({
                Items: form
                  .getFieldValue("Items")
                  .map((item, index) =>
                    index === fieldName
                      ? { ...item, Product: productSearch }
                      : item
                  ),
              });

              console.log(response);
            } catch (error) {
              console.error("Error Adding Product:", error);
            }
          }
        } else {
          const targetForm = event.target.form;
          const index = Array.prototype.indexOf.call(targetForm, event.target);
          if (targetForm[index + 1]) {
            targetForm[index + 1].focus();
          }
        }
      }
  };

  const handleCustomerSearch = (value) => {
    const filteredResults = customers.filter((customer) =>
      customer.value.includes(value)
    );

    if (filteredResults.length === 0) {
      setTypedNewCustomerValue(value.length > 10 ? value.slice(0, 10) : value);
    } else {
      setTypedNewCustomerValue("cleared");
    }
  };

  const handleProductSearch = (value) => {
    const filteredResults = products.filter((product) =>
      product.value.includes(value)
    );

    if (filteredResults.length === 0) {
      setProductSearch(value);
    } else {
      setProductSearch("cleared");
    }
  };

  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      const targetForm = e.target.form;
      if (e.target.id === "Customer") {
        if (form.getFieldValue(e.target.id)) {
          e.preventDefault();
          const index = Array.prototype.indexOf.call(targetForm, e.target);
          if (targetForm[index + 3]) {
            targetForm[index + 3].focus();
          }
        }
      } else if (e.target.id === "Sales_Executive") {
        if (form.getFieldValue(e.target.id)) {
          e.preventDefault();
          const index = Array.prototype.indexOf.call(targetForm, e.target);
          if (targetForm[index + 1]) {
            targetForm[index + 1].focus();
          }
        }
      } else if (
        e.target.id.startsWith("Items") &&
        e.target.id.endsWith("Product")
      ) {
        if (
          form.getFieldValue("Items")[
            Number(document.activeElement.id.split("_")[1])
          ]?.Product
        ) {
          e.preventDefault();
          const index = Array.prototype.indexOf.call(targetForm, e.target);
          if (targetForm[index + 1]) {
            targetForm[index + 1].focus();
          }
        }
      } else if (e.target.id.includes("Description")) {
        e.preventDefault();
        const index = Array.prototype.indexOf.call(targetForm, e.target);
        if (targetForm[index + 2].type === "button") {
          targetForm[index + 3].focus();
        } else {
          targetForm[index + 2].focus();
        }
      } else {
        e.preventDefault();
        const index = Array.prototype.indexOf.call(targetForm, e.target);
        if (targetForm[index + 1]) {
          targetForm[index + 1].focus();
        } else if (targetForm[index].type === "submit") {
          e.preventDefault();
          targetForm[index].click();
        }
      }
    } else if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
      handleAddProductLineItemOnKeyDown(e);
    } else if (
      (e.ctrlKey || e.metaKey) &&
      (e.key === "Backspace" ||
        e.key === "Delete" ||
        (e.key === "Delete" && e.fnKey))
    ) {
      e.target.id.includes("Items") && handleDeleteProductLineItemOnKeyDown(e);
    }
  };

  const handleAddProductLineItemOnKeyDown = (e) => {
    addLineItemBtnRef?.current.click();
    if (e.target.id.includes("Items")) {
      const nextLineItemsIndex = Number(e.target.id.split("_")[1]) + 1;
      setTimeout(() => {
        document.getElementById(`Items_${nextLineItemsIndex}_Product`).focus();
      }, 500);
    }
  };

  const handleDeleteProductLineItemOnKeyDown = (e) => {
    const targetForm = e.target.form;
    const index = Array.prototype.indexOf.call(targetForm, e.target);

    const idParts = e.target.id.split("_");
    const currentElement = idParts[2];

    idParts[2] = "Remove";
    const removeBtnId = idParts.join("_");

    document.getElementById(removeBtnId).click();

    switch (currentElement) {
      case "Product":
        targetForm[index - 2] && targetForm[index - 2].focus();
        break;
      case "Quantity":
        targetForm[index - 3] && targetForm[index - 3].focus();
        break;
      case "Description":
        targetForm[index - 4] && targetForm[index - 4].focus();
        break;
    }
  };

  return (
    <div className="p-3">
      <Form
        onFinish={onSubmit}
        form={form}
        layout="vertical"
        onKeyDown={handleFormKeyDown}
        initialValues={formInitialValues}
        scrollToFirstError={true}
      >
        <div className="grid grid-cols-2 gap-5">
          {/* Customer Name */}
          <Form.Item
            label="Customer Name"
            name="Customer"
            rules={[{ required: true, message: "Please select a customer" }]}
            className="w-[300px]"
          >
            <Select
              options={customers}
              onSearch={handleCustomerSearch}
              showSearch
              allowClear
              autoFocus
              ref={customerNameFieldRef}
              onKeyDown={handleAddNewCustomerOnKeyDown}
              dropdownRender={(menu) => <>{menu}</>}
            />
          </Form.Item>
          <Modal
            open={openCustomer}
            onCancel={handleModalClose}
            onClose={handleModalClose}
            onOk={handleModalClose}
            footer={<></>}
          >
            <Customer
              modalResetTrigger={modalResetTrigger}
              handleModalClose={handleModalClose}
              addNewCustomer={addNewCustomer}
              newCustomerPhoneNumber={typedNewCustomerValue}
            />
          </Modal>

          {/* Branch */}
          <Form.Item
            className="w-[300px]"
            label="Branch"
            name="Branch"
            rules={[{ required: true, message: "Please select a branch" }]}
          >
            <Select options={branches} disabled />
          </Form.Item>

          {/* Sales Person */}
          <Form.Item
            className="w-[300px]"
            label="Sales Person"
            name="Sales_Person"
            rules={[
              { required: true, message: "Please select a sales person" },
            ]}
          >
            <Select options={salesPersons} showSearch allowClear disabled />
          </Form.Item>

          <Form.Item
            className="w-[300px]"
            name="Sales_Executive"
            label="Sales Executive"
            rules={[
              { required: true, message: "Please select a sales executive" },
            ]}
          >
            <Select options={salesExecutives} allowClear showSearch />
          </Form.Item>
        </div>
        <div className="flex flex-col">
          <Form.Item
            layout="horizontal"
            label="Home Delivery"
            name="Home_Delivery"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            layout="horizontal"
            label="Due Products"
            name="Due_Products"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
          <Form.Item
            layout="horizontal"
            label="Confirm with Customers"
            name="Confirm_with_Customers"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        </div>
        <div className="flex gap-3 p-2 bg-slate-100">
          <div className="w-[300px]">Product Name</div>
          <div className="w-[100px]">Quantity</div>
          <div className="w-[300px]">Description</div>
        </div>
        <Form.List name="Items">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} className="flex gap-3 border-b p-3">
                  <Form.Item
                    {...restField}
                    name={[name, "Product"]}
                    rules={[{ required: true, message: "Product is required" }]}
                    className="w-[300px]"
                  >
                    <Select
                      options={products}
                      placeholder="Select Product"
                      allowClear
                      showSearch
                      onKeyDown={(event) =>
                        handleAddNewProductOnKeyDown(event, name)
                      }
                      onSearch={(value) => handleProductSearch(value, name)}
                    />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "Quantity"]}
                    rules={[
                      { required: true, message: "Quantity is required" },
                      { type: "number", min: 1, message: "Must be at least 1" },
                    ]}
                    className="w-[100px]"
                  >
                    <InputNumber min={1} placeholder="Quantity" />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, "Description"]}
                    className="w-[300px]"
                  >
                    <Input.TextArea placeholder="Description" />
                  </Form.Item>

                  <Button
                    id={"Items_" + name + "_Remove"}
                    danger
                    type="text"
                    onClick={() => remove(name)}
                    icon={<CloseOutlined />}
                  />
                </div>
              ))}

              <Button
                hidden
                type="dashed"
                onClick={() => add({ Quantity: 1 })}
                className="mt-3"
                ref={addLineItemBtnRef}
              >
                + Add Line Item
              </Button>
            </>
          )}
        </Form.List>

        <div className="flex justify-center gap-4 p-3">
          {contextHolder}
          <Button type="primary" htmlType="submit" loading={loading}>
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default App;
