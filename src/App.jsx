import { Button, FormControl, FormLabel, TextField } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Select from "react-select";
import { getRecords } from "./api/zoho";

const App = () => {
  const [customers, setCustomers] = useState([]);
  const [salesPersons, setSalesPesons] = useState([]);
  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    customerName: null,
    orderDate: dayjs(),
    salesPerson: null,
    branch: null,
    lineItems: [{ product: null, quantity: 1, description: "" }],
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLineItemChange = (index, field, value) => {
    const updatedLineItems = [...formData.lineItems];
    updatedLineItems[index][field] = value;
    setFormData((prev) => ({ ...prev, lineItems: updatedLineItems }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        { product: null, quantity: 1, description: "" },
      ],
    }));
  };

  const removeLineItem = (index) => {
    const updatedLineItems = formData.lineItems.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, lineItems: updatedLineItems }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.customerName)
      newErrors.customerName = "Customer Name is required.";
    if (!formData.orderDate) newErrors.orderDate = "Order Date is required.";
    if (!formData.salesPerson)
      newErrors.salesPerson = "Sales Person is required.";
    if (!formData.branch) newErrors.branch = "Branch is required.";
    formData.lineItems.forEach((item, index) => {
      if (!item.product) {
        newErrors[`lineItem_${index}_product`] = "Product is required.";
      }
      if (item.quantity <= 0) {
        newErrors[`lineItem_${index}_quantity`] =
          "Quantity must be at least 1.";
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      console.log("Form Data Submitted: ", formData);
    }
  };

  // Add a new line item when Shift key is pressed
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Shift") {
        addLineItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const customerResp = await getRecords("All_Customers", "ID != 0");
        const customer_data = customerResp.map((record) => ({
          label: record.Customer_Name,
          value: record.ID,
        }));
        setCustomers(customer_data);
        const salesResp = await getRecords("All_Employees", "ID != 0");
        const sales_data = salesResp.map((record) => ({
          label: record.Name.display_value,
          value: record.ID,
        }));
        setSalesPesons(sales_data);
        const branchResp = await getRecords("All_Branches", "ID != 0");
        const branch_data = branchResp.map((record) => ({
          label: record.Branch_Name,
          value: record.ID,
        }));
        setBranches(branch_data);
        const initparams = await ZOHO.CREATOR.UTIL.getInitParams();
        const { loginUser } = initparams;
        if (salesResp.length > 0) {
          const user = salesResp.find((i) => i.Email === loginUser);
          if (user) {
            setFormData((prev) => ({
              ...prev,
              salesPerson: { label: user.Name.display_value, value: user.ID },
              branch: {
                label: user.Branch.display_value,
                value: user.Branch.ID,
              },
            }));
          }
        }
      } catch (error) {
        console.log(error);
      }
    };
    init();
  }, []);

  return (
    <form className="p-3" onSubmit={onSubmit}>
      <div className="grid grid-cols-2 gap-5">
        {/* Customer Name */}
        <FormControl className="w-[300px]" error={!!errors.customerName}>
          <FormLabel>Customer Name</FormLabel>
          <Select
            options={customers}
            value={formData.customerName}
            onChange={(value) => handleInputChange("customerName", value)}
          />
          {errors.customerName && (
            <p className="text-red-600">{errors.customerName}</p>
          )}
        </FormControl>

        {/* Order Date */}
        <FormControl className="w-[300px]" error={!!errors.orderDate}>
          <FormLabel>Order Date</FormLabel>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              onChange={(date) => handleInputChange("orderDate", date)}
              value={formData.orderDate}
              format="DD-MMM-YYYY"
              renderInput={(params) => <TextField {...params} />}
            />
          </LocalizationProvider>
          {errors.orderDate && (
            <p className="text-red-600">{errors.orderDate}</p>
          )}
        </FormControl>

        {/* Sales Person */}
        <FormControl className="w-[300px]" error={!!errors.salesPerson}>
          <FormLabel>Sales Person</FormLabel>
          <Select
            options={salesPersons}
            value={formData.salesPerson}
            onChange={(value) => handleInputChange("salesPerson", value)}
          />
          {errors.salesPerson && (
            <p className="text-red-600">{errors.salesPerson}</p>
          )}
        </FormControl>

        {/* Branch */}
        <FormControl className="w-[300px]" error={!!errors.branch}>
          <FormLabel>Branch</FormLabel>
          <Select
            options={branches}
            value={formData.branch}
            onChange={(value) => handleInputChange("branch", value)}
          />
          {errors.branch && <p className="text-red-600">{errors.branch}</p>}
        </FormControl>
      </div>

      <div className="mt-5">
        <div className="flex p-2 bg-slate-50 rounded">
          <FormLabel className="w-[300px] font-bold">Product</FormLabel>
          <FormLabel className="w-[100px] font-bold">Quantity</FormLabel>
          <FormLabel className="w-[300px] font-bold">Description</FormLabel>
        </div>
        {formData.lineItems.map((item, index) => (
          <div
            key={index}
            className="flex gap-3 items-center mb-3 border-b py-4"
          >
            <FormControl
              className="w-[300px]"
              error={!!errors[`lineItem_${index}_product`]}
            >
              <Select
                options={[
                  { label: "Product A", value: "product_a" },
                  { label: "Product B", value: "product_b" },
                ]}
                onChange={(value) =>
                  handleLineItemChange(index, "product", value)
                }
              />
              {errors[`lineItem_${index}_product`] && (
                <p className="text-red-600">
                  {errors[`lineItem_${index}_product`]}
                </p>
              )}
            </FormControl>

            <FormControl
              className="w-[100px]"
              error={!!errors[`lineItem_${index}_quantity`]}
            >
              <TextField
                type="number"
                value={item.quantity}
                size="small"
                onChange={(e) =>
                  handleLineItemChange(
                    index,
                    "quantity",
                    parseInt(e.target.value) || 0
                  )
                }
              />
              {errors[`lineItem_${index}_quantity`] && (
                <p className="text-red-600">
                  {errors[`lineItem_${index}_quantity`]}
                </p>
              )}
            </FormControl>

            <FormControl className="w-[300px]">
              <TextField
                placeholder="Description"
                value={item.description}
                size="small"
                onChange={(e) =>
                  handleLineItemChange(index, "description", e.target.value)
                }
              />
            </FormControl>

            <Button color="error" onClick={() => removeLineItem(index)}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                fill="currentColor"
                className="bi bi-x"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
              </svg>
            </Button>
          </div>
        ))}
        <Button onClick={addLineItem}>Add Row</Button>
      </div>

      <div className="flex justify-center gap-4 p-3">
        <Button variant="contained" type="submit">
          Submit
        </Button>
      </div>
    </form>
  );
};

export default App;
