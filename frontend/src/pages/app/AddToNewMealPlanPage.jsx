import { useOutletContext } from "react-router"
import { Box, Button, Field, DatePicker, Input, Portal } from "@chakra-ui/react";
import RecipeCard from "../../components/RecipeCard";
import { useState } from "react";

const formatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

export default function AddToNewMealPlanPage() {
    const selectedRecipe = useOutletContext();
    const currentDate = new Date()

    const [selectedDate, setSelectedDate] = useState(new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), currentDate.getHours(), currentDate.getMinutes()))
    const timeValue = `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`

    const onTimeChange = (e) => {
        const [hours, minutes] = e.currentTarget.value.split(":").map(Number)

        const nextDate = new Date(selectedDate)
        nextDate.setHours(hours)
        nextDate.setMinutes(minutes)

        setSelectedDate(nextDate)
    }

    const onDateChange = (details) => {
        const newDateVal = details.value[0]

        if (!newDateVal) {
            return
        }

        const nextDate = new Date(selectedDate)
        
        nextDate.setFullYear(newDateVal.year)
        nextDate.setMonth(newDateVal.month - 1)
        nextDate.setDate(newDateVal.day)

        setSelectedDate(nextDate)
    }

    return (
        <Box
            width="100%">
            <form>
                <Box
                    width="100%"
                    fontSize="1rem"
                    display="flex"
                    flexDirection="column"
                    gap="6">
                    <Field.Root required>
                        <Field.Label fontWeight="semibold" fontSize="1em">
                            Meal Name
                        </Field.Label>
                        <Input
                            name="meal-name"
                            placeholder="Enter here..." 
                            size="lg"
                            border="solid 1px #7A7A7A"
                            background="#E7E7E7" />
                    </Field.Root>
                    <DatePicker.Root
                        onValueChange={onDateChange}
                        closeOnSelect={false}
                        width="100%"
                    >
                        <DatePicker.Label fontWeight="semibold" fontSize="1em">Meal Date</DatePicker.Label>
                        <DatePicker.Control>
                            <DatePicker.Trigger asChild unstyled>
                                <Button
                                    variant="outline" 
                                    width="full" 
                                    justifyContent="space-between"
                                    size="lg"
                                    background="#E7E7E7"
                                    border="solid 1px #7A7A7A"
                                >
                                    {selectedDate ? formatter.format(selectedDate) : "Select date and time"}
                                    <i className="ri-calendar-line" style={{lineHeight: 1, fontSize: "1.7em"}}></i>
                                </Button>
                            </DatePicker.Trigger>
                        </DatePicker.Control>

                        <Portal>
                            <DatePicker.Positioner>
                                <DatePicker.Content>
                                    <DatePicker.View view="day">
                                        <DatePicker.Header />
                                        <DatePicker.DayTable />
                                        <Input
                                            type="time"
                                            value={timeValue}
                                            onChange={onTimeChange}
                                            mt="2" />
                                    </DatePicker.View>
                                </DatePicker.Content>
                            </DatePicker.Positioner>
                        </Portal>
                    </DatePicker.Root>
                </Box>
            </form>
            <Box
                marginTop="1.6rem"
                width="100%"
                height="2px"
                bgColor="black" />
            <Box marginTop="1.6rem">
                {(selectedRecipe) && <RecipeCard dish={selectedRecipe} />}
            </Box>

            <Box
                display="flex"
                justifyContent="space-between"
                fontSize="1rem"
                marginTop="3rem"
            >
                <Button 
                    size="xl" 
                    fontSize="1.5em"
                    fontWeight="bold"
                    padding="1.5rem 2.5rem"
                    rounded="14px"
                    boxShadow="0 6.33px 6.33px rgb(0 0 0 / 25%)"
                    background="#7A7A7A">Cancel</Button>

                <Button 
                    size="xl" 
                    fontSize="1.5em"
                    fontWeight="bold"
                    padding="1.5rem 2.5rem"
                    rounded="14px"
                    boxShadow="0 6.33px 6.33px rgb(0 0 0 / 25%)">Create</Button>
            </Box>
        </Box>
    )
}