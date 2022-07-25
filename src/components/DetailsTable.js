import React from 'react'

function DetailsTable({list}){
    return <table>
        <tr>
        <th align='left'>Code</th>
        <th align='center'>Type</th>
        <th align='center'>Valid from</th>
        </tr>
        {list.map((val, key) => {
            return (
                <tr key={key}>
                    <td width={150}>{val.code}</td>
                    <td width={100} align='center'>{val.type}</td>
                    <td width={100} align='center'>{val.validFrom}</td>
                </tr>
            )
        })}
  </table>
}

export default DetailsTable