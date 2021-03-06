/** @jsx jsx */

import {createRef, useEffect, useContext, useMemo} from 'react'
import {css, jsx} from "@emotion/core";
import {FixedSizeList as List} from "react-window"
import st from './style.module.css'
import DropdownContext from "../../DropdownContext";
import DropdownItem from "../DropdownItem"
import {setItemSizes, clickOnItem} from "../../actions";
import Fuse from "fuse.js";
import EmptyList from "../EmptyList";

const DropdownItemFunc = (props) => (listProps) => {
    const {style, index} = listProps
    const {data, onClick} = props
    const handler = () => onClick(data[index].label)
    const item = data[index]
    return (
        <div style={style}>
            <DropdownItem {...{value: item.value, label: item.label, checked: item.checked, onClick: handler}} />
        </div>
    )
}

// calculate the widest row in list
const longestRowIndex = ({data, fieldName}) => {
    return data.reduce((acc, item, index) => {
        const length = item[fieldName].length
        return length > data[acc][fieldName].length ? index : acc
    }, 0)
}


const ItemsBox = (props) => {
    const {
        multiSelect,
        loadingWildcard, emptyListWildcard,
        widthMenuLikeButton,
        dispatch,
        state: {isLoading, maxHeight, maxWidth, minWidth, buttonWidth, data, itemWidth, itemHeight, inputValue}} = useContext(DropdownContext)
    console.log('ItemBox', maxWidth, minWidth, buttonWidth)
    const itemRef = createRef()
    const fuseOption = {
        shouldSort: true,
        threshold: 0.15,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: [
            'label'
        ]
    }
    const fuse = useMemo(() => new Fuse(data, fuseOption), [data, fuseOption])
    useEffect(() => {
        if (widthMenuLikeButton && itemRef.current && itemRef.current.offsetHeight) {
            setTimeout(() => {
                const width = buttonWidth > maxWidth
                    ? maxWidth
                    : (buttonWidth < minWidth ? minWidth : buttonWidth + 1)
                console.log('width item like button', width, minWidth, maxWidth, buttonWidth)
                dispatch(setItemSizes({width, height: itemRef.current.offsetHeight}))
            }, 0)
        } else if (!itemWidth && !itemHeight && itemRef.current && itemRef.current.offsetWidth && itemRef.current.offsetHeight) {
            setTimeout(() => {
                const width = maxWidth && itemRef.current.offsetWidth > maxWidth
                    ? maxWidth
                    : (minWidth && itemRef.current.offsetWidth < minWidth ? minWidth : itemRef.current.offsetWidth + 1)
                console.log('width item', width, minWidth, maxWidth, buttonWidth)
                dispatch(setItemSizes({width, height: itemRef.current.offsetHeight}))
            }, 0)

        }
    }, [itemRef, buttonWidth, widthMenuLikeButton])

    const onClickHandler = ((multiSelect) => (value) => {
        console.log('item', value)
        dispatch(clickOnItem({value, multiSelect}))
    })(multiSelect)

    const fuseFilter = (template) => {
        if (!template) return data
        return fuse.search(template).map(item => item.item)
    }

    // const filteredData = dataFilter(inputValue)
    const fuseFiltered = fuseFilter(inputValue)
    // calculate height of listBox depend on amount of items
    const listBoxHeight = () => {
        return !itemHeight ? maxHeight : (fuseFiltered.length * itemHeight > maxHeight ? maxHeight : fuseFiltered.length * itemHeight)
    }
    //if haven't set sizes of item for List component mount the longest item and get its sizes
    if (isLoading) {
        return (
            (
                <div css={css`
                              max-height: ${maxHeight}px;
                              overflow-y: auto;
                              max-width: ${widthMenuLikeButton && buttonWidth ? buttonWidth : maxWidth}px; 
                              min-width: ${widthMenuLikeButton && buttonWidth ? buttonWidth : minWidth}px`}>
                    {/*<div css={css`overflow-y: auto; max-width: ${maxWidth}px; min-width: ${minWidth}px`} >*/}
                        {/*<EmptyList label={loadingWildcard} /></div>*/}
                    <DropdownItem label={loadingWildcard} showCheckIcon={false} onClick={() => {}} />
                    {/*</div>*/}
                </div>
            )
        )
    } else if (data.length === 0) {
        return (
            (
                <div css={css`max-height: ${maxHeight}px;overflow-y: auto; max-width: ${maxWidth}px; min-width: ${minWidth}px`}>
                    {/*<div css={css`overflow-y: auto; max-width: ${maxWidth}px; min-width: ${minWidth}px`} >*/}
                        <DropdownItem label={emptyListWildcard} showCheckIcon={false} onClick={() => {}} />
                {/*</div>*/}
                </div>
            )
        )
    } else if (!itemWidth && ! itemHeight) {
        const longestItem = data[longestRowIndex({data, fieldName: 'label'})]
        return (
            <div css={css`max-height: ${maxHeight}px;overflow-y: scroll; max-width: ${maxWidth}px; min-width: ${minWidth}px`} ref={itemRef}>
                {/*<div css={css`overflow-y: scroll; max-width: ${maxWidth}px; min-width: ${minWidth}px`} ref={itemRef}>*/}
                    <DropdownItem {...{value: longestItem.value, label: longestItem.label, checked: longestItem.checked }} />
                {/*</div>*/}
            </div>
        )
    }  else {
        return (
            <List
                className={st.List}
                height={listBoxHeight()}
                itemCount={fuseFiltered.length}
                itemSize={itemHeight}
                width={itemWidth}
            >
                {DropdownItemFunc({data: fuseFiltered, onClick: onClickHandler})}
            </List>
        )
    }
}
export default ItemsBox


