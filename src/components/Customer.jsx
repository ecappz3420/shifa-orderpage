import { Button, Form, Input, InputNumber } from "antd";
import React, { useRef, useEffect } from "react";
import { postRecord } from "../api/zoho";

const Customer = ({
  modalResetTrigger,
  handleClose,
  addNewCustomer,
  newCustomerPhoneNumber,
}) => {
  const [form] = Form.useForm();

  const customerNameFieldRef = useRef(null);

  useEffect(() => {
    // Perform actions every time the modal is opened
    if (customerNameFieldRef.current) {
      setTimeout(() => customerNameFieldRef.current.focus(), 0);
    }
    form.setFieldValue("Phone_Number", Number(newCustomerPhoneNumber));
  }, [modalResetTrigger]);

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
        key: response.ID,
      });
      handleClose();
      form.resetFields();
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
            formatter={(value) => `+91${value}`}
            maxLength={10}
            className="w-[300px]"
            style={{ width: "100%" }}
          />
        </Form.Item>
        <Form.Item
          label="Email"
          name="Email"
          className="w-[300px]"
          rules={[
            {
              type: "email",
              message: "Please input a valid email address!",
            },
          ]}
        >
          <Input type="email" />
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
