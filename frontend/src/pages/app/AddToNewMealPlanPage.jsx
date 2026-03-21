import { useOutletContext } from "react-router"
import { Box, Text, Field, DatePicker, Input, Portal } from "@chakra-ui/react";


export default function AddToNewMealPlanPage() {
    const selectedRecipe = useOutletContext();
    return (
        <Box
            width="100%">
            <form>
                <Box
                    width="100%"
                    fontSize="1.2rem">
                    <Field.Root required>
                        <Field.Label>
                            Meal Name
                        </Field.Label>
                        <Input
                            name="meal-name"
                            placeholder="Enter here..." />
                    </Field.Root>
                    <DatePicker.Root name="date">
                        <DatePicker.Label>Meal Date</DatePicker.Label>
                        <DatePicker.Control>
                            <DatePicker.Input required />
                            <DatePicker.IndicatorGroup>
                                <DatePicker.Trigger>
                                    <Text>Test</Text>
                                </DatePicker.Trigger>
                            </DatePicker.IndicatorGroup>
                        </DatePicker.Control>
                        <Portal>
                            <DatePicker.Positioner>
                                <DatePicker.Content>
                                    <DatePicker.View view="day">
                                        <DatePicker.Header />
                                        <DatePicker.DayTable />
                                    </DatePicker.View>
                                    <DatePicker.View view="month">
                                        <DatePicker.Header />
                                        <DatePicker.MonthTable />
                                    </DatePicker.View>
                                    <DatePicker.View view="year">
                                        <DatePicker.Header />
                                        <DatePicker.YearTable />
                                    </DatePicker.View>
                                </DatePicker.Content>
                            </DatePicker.Positioner>
                        </Portal>
                    </DatePicker.Root>
                </Box>
            </form>
            
        </Box>
    )
}