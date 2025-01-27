import { Button, Form, Input, InputNumber } from "antd";
import React, { useRef, useEffect } from "react";
import { postRecord } from "../api/zoho";

const Customer = ({ handleClose, addNewCustomer, newCustomerPhoneNumber }) => {
  const [form] = Form.useForm();

  const customerNameFieldRef = useRef(null);

  useEffect(() => {
    // Focus the input after the component is mounted
    if (customerNameFieldRef.current) {
      customerNameFieldRef.current.focus();
    }
  }, []);

  const onSubmit = async (data) => {
    try {
      const formData = {
        data: data,
      };
      const response = await postRecord("Customer", formData);
      console.log(response);
      addNewCustomer({
        label: `${data.Phone_Number} - ${data.Customer_Name}`,
        value: `${data.Phone_Number}`,
        id: response.ID,
      });
      handleClose();
    } catch (error) {
      console.log(`Error Adding Record: ${error}`);
    }
  };
  return (
    <div>
      <Form form={form} onFinish={onSubmit} layout="vertical">
        <Form.Item
          label="Customer Name"
          name="Customer_Name"
          className="w-[300px]"
          rules={[{ required: true, message: "Please enter a customer name" }]}
        >
          <Input ref={customerNameFieldRef} />
        </Form.Item>
        <Form.Item
          label="Phone"
          name="Phone_Number"
          className="w-[300px]"
          rules={[{ required: true, message: "Please enter a phone number" }]}
          initialValue={Number(newCustomerPhoneNumber)}
        >
          <InputNumber
            prefix="+91"
            maxLength={10}
            className="w-[300px]"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item label="Email" name="Email" className="w-[300px]">
          <Input />
        </Form.Item>
        <Form.Item label="Address" name="Address" className="w-[300px]">
          <Input.TextArea />
        </Form.Item>
        <div className="text-center">
          <Button type="primary" htmlType="submit">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Customer;
