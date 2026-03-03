import {
  Combobox,
  useComboboxContext,
  Dialog,
  Stack,
  Button,
  useFilter,
  useListCollection,
} from "@chakra-ui/react"
import { useEffect, useState } from "react"
import { useIngredInputContext } from "../context/IngredientInputContext"

function ComboBoxHiddenInput(props) {
  const comboBoxCtx = useComboboxContext()

  const value = comboBoxCtx.value[0] ? JSON.stringify(comboBoxCtx.value[0]) : ""
  return (
    <input type="hidden" value={value} readOnly {...props} />
  )
}

export default function IngredientComboBox({staticIngredList}) {
  const {addIngred} = useIngredInputContext()


  const { contains } = useFilter({ sensitivity: "base" })

  const { collection, filter } = useListCollection({
    initialItems: staticIngredList,
    itemToString: (item) => item.ingredient_name,
    itemToValue: (item) => item,
    filter: contains
  }) 

  const handleSubmit = (e) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const rawData = formData.get("selected-ingredient")
    const data = JSON.parse(rawData)
    addIngred(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Stack gap="2rem" align="flex-start">
          <Combobox.Root
            collection={collection}
            onInputValueChange={(e) => filter(e.inputValue)}
            width="100%"
            openOnClick>
            <Combobox.Control>
              <Combobox.Input placeholder="Type to search" />
              <Combobox.IndicatorGroup>
                <Combobox.ClearTrigger />
                <Combobox.Trigger />
              </Combobox.IndicatorGroup>
            </Combobox.Control>
            <ComboBoxHiddenInput name="selected-ingredient" />
              <Combobox.Positioner>
                <Combobox.Content maxHeight="300px">
                  <Combobox.Empty>No items found</Combobox.Empty>
                  {collection.items.map((item) => (
                    <Combobox.Item item={item} key={item.ingredient_id} contentVisibility="auto">
                      {item.ingredient_name}
                      <Combobox.ItemIndicator />
                    </Combobox.Item>
                  ))}
                </Combobox.Content>
              </Combobox.Positioner>
          </Combobox.Root>

          <Dialog.ActionTrigger asChild>
              <Button width="100%" type="submit">Select</Button>
          </Dialog.ActionTrigger>
      </Stack>
    </form>
  )
}