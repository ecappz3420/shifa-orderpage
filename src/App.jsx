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
  const [statuses, setStatuses] = useState([]);
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

  const handleClose = () => {
    setOpenCustomer(false);
  };
  const addNewCustomer = (data) => {
    setCustomers((prev) => [...prev, data]);
    form.setFieldsValue({ Customer: data.value });
  };

  useEffect(() => {
    const init = async () => {
      form.setFieldsValue({ Home_Delivery: false });
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

  const handleKeydown = async (event, fieldName) => {
    if (event.ke && event.shiftKey && productSearch) {
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
                index === fieldName ? { ...item, Product: productSearch } : item
              ),
          });

          console.log(response);
        } catch (error) {
          console.error("Error Adding Product:", error);
        }
      }
    }
  };

  const handleKeyDownOnForm = (event) => {
    if (
      event.ctrlKey &&
      event.shiftKey &&
      document.activeElement.id !== "Customer" &&
      !(
        document.activeElement.id.includes("Items") &&
        document.activeElement.id.includes("Product")
      )
    ) {
      addLineItemBtnRef?.current.click();
    } else if (event.key === "Enter" && event.ctrlKey) {
      form.submit();
    }
  };

  const handleAddNewCustomer = (event) => {
    if (event.ctrlKey && event.shiftKey) {
      setModalResetTrigger((prev) => prev + 1);
      setOpenCustomer(true);
    }
  };

  const handleSearch = (value) => {
    setTypedNewCustomerValue(value.length > 10 ? value.slice(0, 10) : value);
  };

  return (
    <div className="p-3">
      <Form
        onFinish={onSubmit}
        form={form}
        layout="vertical"
        onKeyDown={handleKeyDownOnForm}
        initialValues={formInitialValues}
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
              onSearch={handleSearch}
              showSearch
              allowClear
              autoFocus
              ref={customerNameFieldRef}
              onKeyDown={handleAddNewCustomer}
              dropdownRender={(menu) => (
                <>
                  {menu}
                  {/* <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      padding: "4px",
                      borderTop: "1px solid #f0f0f0",
                    }}
                  >
                    <Button type="link" onClick={() => setOpenCustomer(true)}>
                      + Add New Customer
                    </Button>
                  </div> */}
                </>
              )}
            />
          </Form.Item>
          <Modal
            open={openCustomer}
            onCancel={handleClose}
            onClose={handleClose}
            onOk={handleClose}
            footer={<></>}
          >
            <Customer
              modalResetTrigger={modalResetTrigger}
              handleClose={handleClose}
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
          <Form.Item
            layout="horizontal"
            label="Home Delivery"
            name="Home_Delivery"
            valuePropName="checked"
          >
            <Checkbox />
          </Form.Item>
        </div>
        <div className="flex gap-3 p-2 bg-slate-100">
          <div className="w-[300px]">Product Name</div>
          <div className="w-[100px]">Quantity</div>
          <div className="w-[300px]">Description</div>
          {/* <div className="w-[300px]">Status</div> */}
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
                      onKeyDown={(event) => handleKeydown(event, name)}
                      onSearch={(value) => setProductSearch(value)}
                    />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, "Quantity"]}
                    initialValue={1}
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
                  {/* <Form.Item
                    {...restField}
                    name={[name, "Status"]}
                    initialValue={"Pending"}
                    rules={[{ required: true, message: "Status is required" }]}
                    className="w-[200px]"
                  >
                    <Select options={statuses} allowClear showSearch />
                  </Form.Item> */}

                  <Button
                    danger
                    type="text"
                    onClick={() => remove(name)}
                    icon={<CloseOutlined />}
                  />
                </div>
              ))}

              <Button
                type="dashed"
                onClick={() => add()}
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
